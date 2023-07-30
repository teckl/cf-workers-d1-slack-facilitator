import { Hono } from 'hono'
import { logger } from 'hono/logger';
//import { zValidator } from '@hono/zod-validator';

export interface Env {
    DB: D1Database;
    SLACK_API_TOKEN: SLACK_API_TOKEN;
}

const app = new Hono<{ Bindings: Env }>();
const commandName = '/facilitator';

app.use('*', logger())

app.get('/', (c) => c.text('Hello Hono!'))

// refs https://api.slack.com/interactivity/slash-commands
// refs https://developers.cloudflare.com/d1/platform/client-api/
// refs https://dev.classmethod.jp/articles/notify-daily-scrum-facilitator-slack-bot/
app.post('/facilitator', async c => {

    try {
        const body = await c.req.parseBody();

        const text = body.text;

        const [command, ...args] = text.split(' ');
        console.log(`command : ` + command);
        console.log(`args : ` + args);

        switch (command) {
            case 'list':
                console.log('GET list');
                const { results } = await c.env.DB.prepare(
                    "SELECT username FROM users"
                )
                    .all();
                const usernames = results.map(function (obj) {
                    return obj.username;
                });
                return c.text(usernames.join('\n'));

                break;

            case 'dump':
                console.log(`GET dump`);

                const raw = await c.env.DB.prepare(
                    "SELECT id, username, slack_user_id, created_at, updated_at FROM users"
                )
                    .raw();
                return c.json(raw);

                break;

            case 'random':
                console.log(`GET random`);
                const randomUser = await c.env.DB.prepare(
                    "SELECT id, username, slack_user_id, created_at FROM users ORDER BY RANDOM() LIMIT 1"
                )
                    .first();
                console.log(randomUser);
                console.log(randomUser.slack_user_id);

                const slackApiToken = c.env.SLACK_API_TOKEN;
                console.log(slackApiToken);
                const channelName = 'random';

                const message = `今回のファシリテーターは <@${randomUser.slack_user_id}> ${randomUser.username} さんです。\nよろしくお願いします。`;

                const response = await fetch('https://slack.com/api/chat.postMessage', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${slackApiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        'text': message,
                        'channel': channelName
                    })
                });

                const data = await response.json();
                console.log(data);
                return c.text(message);

                break;

            case 'add':
                console.log(`Adding user: ${args}`);

                const addUsername = args[0];
                const addId = await c.env.DB.prepare(
                    "SELECT id FROM users WHERE username = ? "
                )
                    .bind(addUsername)
                    .first('id');
                console.log(addId);

                if (addId) { return c.text('This user already exists. ' + addUsername) };

                const addInfo = await c.env.DB.prepare(
                    "INSERT INTO users(username) VALUES (?)"
                )
                    .bind(addUsername)
                    .run();

                console.log(addInfo);

                if (addInfo.success) {
                    c.status(201);
                    return c.text('Created : ' + addUsername);
                } else {
                    c.status(500);
                    return c.text('Something went wrong');
                }
                break;

            case 'update':
                console.log(`Updating user: ${args[0]} with param1: ${args[1]} param2: ${args[2]} param3: ${args[3]}`);

                if (args.length < 3) {
                    console.log('Not enough arguments for update command');
                    return c.text(`Not enough arguments for update command. 
                    USAGE:  ${commandName} update usernameXXX slack_user_id UXXXXX`);
                }
                const updateUsername = args[0];
                const updateTargetCol = args[1];
                const updateTargetVal = args[2];

                const updateId = await c.env.DB.prepare(
                    "SELECT id FROM users WHERE username = ?"
                )
                    .bind(updateUsername)
                    .first('id');

                if (!updateId) { return c.text('no such user ' + updateUsername) };

                const updateInfo = await c.env.DB.prepare(
                    `UPDATE users SET ${updateTargetCol} = ? WHERE id = ?`
                )
                    .bind(updateTargetVal, updateId)
                    .run();

                console.log(updateInfo);

                if (updateInfo.success) {
                    c.status(200);
                    return c.text('Updated : ' + updateUsername);
                } else {
                    c.status(500);
                    return c.text('Something went wrong');
                }
                break;

            case 'del':
                console.log(`Deleting user: ${args[0]}`);

                const delUsername = args[0];

                const delId = await c.env.DB.prepare(
                    "SELECT id FROM users WHERE username = ?"
                )
                    .bind(delUsername)
                    .first('id');
                if (!delId) { return c.text('no such user : ' + delUsername) };

                const delInfo = await c.env.DB.prepare(
                    "DELETE FROM users WHERE id = ?"
                )
                    .bind(delId)
                    .run();

                console.log(delInfo);

                if (delInfo.success) {
                    c.status(200);
                    return c.text('Deleated : ' + delUsername);
                } else {
                    c.status(500);
                    return c.text('Something went wrong');
                }
                break;

            default:
                console.log(`Unknown command: ${command}`);
                break;
        };

        const usage = `Usage:
         ${commandName} list 
         ${commandName} random
         ${commandName} add foo
         ${commandName} del foo
         ${commandName} update foo slack_user_id UXXXXX
         ${commandName} dump`;
        return c.text(usage);

    } catch (e) {
        console.error(e);
        throw e;
    }
});

export default app
