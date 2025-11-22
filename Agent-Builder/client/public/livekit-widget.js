/**
 * LiveKit Agent Widget - Production Version
 * Connects to LiveKit rooms and enables real-time voice/video interaction with AI agents
 */

(function() {
  'use strict';

  // Import LiveKit client SDK
  // Using jsdelivr as it's more reliable than unpkg
  // Note: jsdelivr auto-minifies, so we use the .umd.js file
  const LIVEKIT_CDN = 'https://cdn.jsdelivr.net/npm/livekit-client@2.16.0/dist/livekit-client.umd.js';

  class LiveKitAgentWidget {
    constructor(config) {
      this.config = {
        agentId: config.agentId,
        agentName: config.agentName || 'AI Agent',
        apiUrl: config.apiUrl || window.location.origin,
        theme: config.theme || 'light',
        position: config.position || 'bottom-right',
        primaryColor: config.primaryColor || '#3b82f6',
        buttonText: config.buttonText || 'Chat with us',
      };

      this.isOpen = false;
      this.room = null;
      this.isConnected = false;
      this.isMuted = false;
      this.isVideoEnabled = false;

      this.loadLiveKitSDK().then(() => {
        this.init();
      });
    }

    async loadLiveKitSDK() {
      return new Promise((resolve, reject) => {
        if (window.LivekitClient) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = LIVEKIT_CDN;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load LiveKit SDK'));
        document.head.appendChild(script);
      });
    }

    init() {
      this.createStyles();
      this.createButton();
      this.createModal();
    }

    createStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .lk-widget-button {
          position: fixed;
          ${this.config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
          ${this.config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: ${this.config.primaryColor};
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9998;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .lk-widget-button:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        .lk-widget-button svg {
          width: 24px;
          height: 24px;
        }
        .lk-widget-modal {
          position: fixed;
          ${this.config.position.includes('bottom') ? 'bottom: 90px;' : 'top: 90px;'}
          ${this.config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
          width: 400px;
          max-width: calc(100vw - 40px);
          height: 600px;
          max-height: calc(100vh - 120px);
          background: ${this.config.theme === 'dark' ? '#1f2937' : 'white'};
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          display: none;
          flex-direction: column;
          z-index: 9999;
          overflow: hidden;
        }
        .lk-widget-modal.open {
          display: flex;
        }
        .lk-widget-header {
          padding: 16px 20px;
          background: ${this.config.primaryColor};
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .lk-widget-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
        .lk-widget-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }
        .lk-widget-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .lk-widget-video-container {
          flex: 1;
          background: #000;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lk-widget-video-container video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .lk-widget-status {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          text-align: center;
          padding: 20px;
        }
        .lk-widget-controls {
          padding: 16px;
          background: ${this.config.theme === 'dark' ? '#374151' : '#f3f4f6'};
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        .lk-widget-control-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: none;
          background: ${this.config.theme === 'dark' ? '#4b5563' : 'white'};
          color: ${this.config.theme === 'dark' ? 'white' : '#1f2937'};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .lk-widget-control-btn:hover {
          transform: scale(1.05);
        }
        .lk-widget-control-btn.active {
          background: ${this.config.primaryColor};
          color: white;
        }
        .lk-widget-control-btn.danger {
          background: #ef4444;
          color: white;
        }
        .lk-widget-control-btn svg {
          width: 20px;
          height: 20px;
        }
        .lk-widget-spinner {
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: lk-spin 1s linear infinite;
        }
        @keyframes lk-spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    createButton() {
      const button = document.createElement('button');
      button.className = 'lk-widget-button';
      button.innerHTML = `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
      `;
      button.onclick = () => this.toggle();
      document.body.appendChild(button);
      this.button = button;
    }

    createModal() {
      const modal = document.createElement('div');
      modal.className = 'lk-widget-modal';
      modal.innerHTML = `
        <div class="lk-widget-header">
          <h3>${this.config.agentName}</h3>
          <button class="lk-widget-close">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="lk-widget-body">
          <div class="lk-widget-video-container">
            <div class="lk-widget-status">
              <div class="lk-widget-spinner"></div>
              <p style="margin-top: 16px;">Connecting...</p>
            </div>
            <video id="lk-widget-local-video" autoplay muted playsinline style="display:none;"></video>
            <video id="lk-widget-remote-video" autoplay playsinline style="display:none;"></video>
          </div>
          <div class="lk-widget-controls">
            <button class="lk-widget-control-btn" id="lk-widget-mic-btn" title="Mute/Unmute">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
              </svg>
            </button>
            <button class="lk-widget-control-btn" id="lk-widget-video-btn" title="Enable/Disable Video">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </button>
            <button class="lk-widget-control-btn danger" id="lk-widget-hangup-btn" title="Hang Up">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      this.modal = modal;

      // Event listeners
      modal.querySelector('.lk-widget-close').onclick = () => this.close();
      modal.querySelector('#lk-widget-mic-btn').onclick = () => this.toggleMute();
      modal.querySelector('#lk-widget-video-btn').onclick = () => this.toggleVideo();
      modal.querySelector('#lk-widget-hangup-btn').onclick = () => this.disconnect();

      this.statusElement = modal.querySelector('.lk-widget-status');
      this.localVideo = modal.querySelector('#lk-widget-local-video');
      this.remoteVideo = modal.querySelector('#lk-widget-remote-video');
    }

    async toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    async open() {
      this.isOpen = true;
      this.modal.classList.add('open');
      
      if (!this.isConnected) {
        await this.connect();
      }
    }

    close() {
      this.isOpen = false;
      this.modal.classList.remove('open');
    }

    async connect() {
      try {
        this.updateStatus('Connecting to agent...', true);

        // Get LiveKit token from backend
        // tRPC expects the input to be wrapped in a "json" property
        const response = await fetch(`${this.config.apiUrl}/api/trpc/livekit.getToken`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            json: {
              agentId: this.config.agentId,
              participantName: 'Guest',
            },
          }),
        });

        const result = await response.json();
        if (!result.result?.data?.json) {
          const errorMsg = result.error?.json?.message || result.error?.message || 'Failed to get connection token';
          throw new Error(errorMsg);
        }

        const { token, url, roomName } = result.result.data.json;

        // Connect to LiveKit room
        this.room = new window.LivekitClient.Room({
          adaptiveStream: true,
          dynacast: true,
        });

        // Set up event handlers
        this.room.on(window.LivekitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === window.LivekitClient.Track.Kind.Video) {
            track.attach(this.remoteVideo);
            this.remoteVideo.style.display = 'block';
            this.statusElement.style.display = 'none';
          } else if (track.kind === window.LivekitClient.Track.Kind.Audio) {
            track.attach();
          }
        });

        this.room.on(window.LivekitClient.RoomEvent.TrackUnsubscribed, (track) => {
          track.detach();
        });

        this.room.on(window.LivekitClient.RoomEvent.Disconnected, () => {
          this.handleDisconnect();
        });

        this.room.on(window.LivekitClient.RoomEvent.ParticipantConnected, (participant) => {
          console.log('Participant connected:', participant.identity);
        });

        // Connect to room
        await this.room.connect(url, token);

        // Publish local audio
        await this.room.localParticipant.setMicrophoneEnabled(true);

        this.isConnected = true;
        this.updateStatus('Connected to ' + this.config.agentName, false);

        // Hide status after 2 seconds
        setTimeout(() => {
          if (this.isConnected) {
            this.statusElement.style.display = 'none';
          }
        }, 2000);

      } catch (error) {
        console.error('Connection error:', error);
        this.updateStatus('Connection failed. Please try again.', false);
        setTimeout(() => {
          if (!this.isConnected) {
            this.close();
          }
        }, 3000);
      }
    }

    async disconnect() {
      if (this.room) {
        this.room.disconnect();
        this.room = null;
      }
      this.isConnected = false;
      this.localVideo.style.display = 'none';
      this.remoteVideo.style.display = 'none';
      this.close();
    }

    handleDisconnect() {
      this.isConnected = false;
      this.updateStatus('Disconnected', false);
      this.localVideo.style.display = 'none';
      this.remoteVideo.style.display = 'none';
    }

    async toggleMute() {
      if (!this.room) return;

      this.isMuted = !this.isMuted;
      await this.room.localParticipant.setMicrophoneEnabled(!this.isMuted);

      const btn = document.getElementById('lk-widget-mic-btn');
      if (this.isMuted) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }

    async toggleVideo() {
      if (!this.room) return;

      this.isVideoEnabled = !this.isVideoEnabled;
      await this.room.localParticipant.setCameraEnabled(this.isVideoEnabled);

      const btn = document.getElementById('lk-widget-video-btn');
      if (this.isVideoEnabled) {
        btn.classList.add('active');
        this.localVideo.style.display = 'block';
        
        // Attach local video track - use videoTrackPublications which is a Map
        const videoTrackPublications = this.room.localParticipant.videoTrackPublications;
        if (videoTrackPublications && videoTrackPublications.size > 0) {
          const firstTrack = Array.from(videoTrackPublications.values())[0];
          if (firstTrack && firstTrack.track) {
            firstTrack.track.attach(this.localVideo);
          }
        }
      } else {
        btn.classList.remove('active');
        this.localVideo.style.display = 'none';
      }
    }

    updateStatus(message, showSpinner) {
      this.statusElement.style.display = 'block';
      this.statusElement.innerHTML = `
        ${showSpinner ? '<div class="lk-widget-spinner"></div>' : ''}
        <p style="margin-top: ${showSpinner ? '16px' : '0'};">${message}</p>
      `;
    }
  }

  // Expose to global scope
  window.LiveKitAgentWidget = LiveKitAgentWidget;
})();
