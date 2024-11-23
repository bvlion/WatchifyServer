# WatchifyServer

[Watchify](https://github.com/bvlion/Watchify) 用の Realtime Database listen サーバー

## .env

```
FIREBASE_CREDENTIAL_JSON=''
FIREBASE_DATABASE_URL="https://"
```

## systemctl

`/etc/systemd/system/WatchifyServer.service`

```
[Unit]
Description=Watchify Service
After=syslog.target network-online.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/node index.js
Restart=on-failure
RestartSec=10
KillMode=process
WorkingDirectory=/home/pi/WatchifyServer

[Install]
WantedBy=multi-user.target
```

