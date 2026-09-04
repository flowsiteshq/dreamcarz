# DreamCarz Concierge Prompt System

The Concierge prompt system is intentionally limited to a compact, fixed mobile composer. Its normal state contains an attachment entry, context-aware text prompt, one microphone, and one gold send action. The separate waveform control was removed to avoid competing voice actions.

The microphone transforms the composer into a dedicated listening state with an animated gold waveform and a cancel control. Short audio is sent for transcription only, is not retained by DreamCarz, and the resulting text returns to the editable composer rather than being sent automatically.

The prompt selects from safe local state only: selected confirmed vehicle, active reservation/enrollment, authenticated member state, or protected account-creation fields. The server receives a validated, minimized journey context and rejects non-confirmed vehicle IDs. The privacy statement is collapsed to a single secure-and-private line and is hidden while the mobile keyboard is open.

Visual validation at 375px, 390px, and 393px confirms the fixed composer remains a single slim control, with attachment, one microphone, and gold send actions visible without horizontal overflow. The one-line privacy affordance stays beneath the composer rather than occupying a separate panel.
