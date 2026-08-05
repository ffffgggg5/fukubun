#!/bin/bash
cd "$(dirname "$0")"

if curl -s -o /dev/null http://localhost:3000; then
  echo "すでに起動しています。ブラウザを開きます。"
  open http://localhost:3000
  sleep 1
  exit 0
fi

echo "サーバーを起動中..."
nohup npm run dev > /tmp/fukubun-dev.log 2>&1 < /dev/null &
disown

for i in $(seq 1 60); do
  if curl -s -o /dev/null http://localhost:3000; then
    echo "起動しました。ブラウザを開きます。"
    open http://localhost:3000
    sleep 1
    exit 0
  fi
  sleep 0.5
done

echo "起動に失敗したかもしれません。ログを確認してください: /tmp/fukubun-dev.log"
sleep 5
