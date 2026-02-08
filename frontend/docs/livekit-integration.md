# LiveKit Integration Plan

## Goal
Replace the current Socket.IO real-time implementation with LiveKit for audio, video, and data channels (questions, metrics, alerts).

## Tasks
- [ ] **Infrastructure**: Add LiveKit and Redis to `docker-compose.yml` → Verify: `docker compose up -d` runs without errors.
- [ ] **Backend (SDK)**: Install `livekit-server-sdk` in `apps/backend` → Verify: `npm list livekit-server-sdk` shows the package.
- [ ] **Backend (Token)**: Implement `LiveKitService` to generate access tokens → Verify: API endpoint returns a valid JWT token.
- [ ] **Frontend (SDK)**: Install `livekit-client` and `@livekit/components-react` in `apps/frontend` → Verify: Packages are listed in `package.json`.
- [ ] **Frontend (Media)**: Implement LiveKit Video/Audio connection in the interview room → Verify: Camera and microphone streams are visible.
- [ ] **Migration (Data Channels)**: Move `metrics_updated`, `alert_received`, and `question_ready` from Socket.IO to LiveKit Data Channels → Verify: Metrics update in real-time on HR dashboard without Socket.IO.
- [ ] **Cleanup**: Remove `Socket.IO` related code from `InterviewGateway` and frontend → Verify: No Socket.IO connections in browser network tab.

## Done When
- [ ] LiveKit server is running via Docker.
- [ ] Users can join an interview room with Audio/Video via LiveKit.
- [ ] Real-time events (questions, metrics) are transmitted via LiveKit Data Channels.
- [ ] Socket.IO is completely removed from the interview flow.

## Notes
- LiveKit requires a `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`.
- Local development will use `host.docker.internal` for backend communication if needed.
