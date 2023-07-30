
# Cloudflare Workers + Hono + D1 + Slack Slash Commands Sample.

Randomly determine facilitators for internal technical workshops using Slack slash commands.

This is a practice sample for D1 and Slack Slash Commands, so security and other considerations are not taken into account at this time.

## Setup

```
npm install
npm run dev
```

```
npm run deploy
wrangler tail
```

### D1 setup
```
wrangler d1 create  facilitator
wrangler d1 execute facilitator  --file=./schema.sql
```


## Slack Command Install
refs https://api.slack.com/interactivity/slash-commands

### Request URL
https://facilitator.xxxxxx.workers.dev/facilitator

### Usage Hint
`list / random / add xxx / del xxx / update xxx slack_user_id UXXX / dump`

### Bot Token scopes
- commands
- chat:write


## Set Slack API Token

```
wrangler secret put SLACK_API_TOKEN
```

## Slack Command Usage
```
/facilitator list
/facilitator random
/facilitator add foo
/facilitator del foo
/facilitator update foo slack_user_id UXXXXX
/facilitator dump
```

## Manual SQL execution

```
wrangler d1 execute facilitator  --command='select * from users'
```

## Using curl

```
$ curl -s -X POST 'https://facilitator.xxxxxxxx.workers.dev/facilitator' -d 'text=list'
kagamihara
ohgaki
shima
teckl
$ curl -s -X POST 'https://facilitator.xxxxxxxx.workers.dev/facilitator' -d 'text=dump'
[[2,"teckl","UXXXXTECKL","2023-07-30 16:58:52","2023-07-30 16:58:52"],[3,"kagamihara","UXXXXX","2023-07-30 17:00:44","2023-07-30 17:00:44"],[4,"shima","UXXXXXSHIMA","2023-07-30 17:00:53","2023-07-30 17:00:53"],[5,"ohgaki","UXXXOHGAKI","2023-07-30 17:01:17","2023-07-30 17:01:17"]]%
$ curl -s -X POST 'https://facilitator.xxxxxxxx.workers.dev/facilitator' -d 'text=random'
今回のファシリテーターは <@UXXXOHGAKI> ohgaki さんです。
よろしくお願いします。%
```

## SEE ALSO
[Cloudflare Workers + D1を使ってSlackのスラッシュコマンドを作ってみた](https://qiita.com/teckl/items/be3b2e9f2548f41a93fa)

## License

MIT

## Author

teckl <https://github.com/teckl>

