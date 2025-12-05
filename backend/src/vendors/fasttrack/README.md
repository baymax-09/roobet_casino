# FastTrack CRM

FastTrack CRM integration uses a mix of HTTP API endpoints and a real-time data streaming platform to keep FastTrack up-to-date.
The basic pattern is that when something of interest happens, we send an event using (TBD) to notify FastTrack.
They will then send an HTTP request to get the relevant data.
