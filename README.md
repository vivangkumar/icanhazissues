### icanhazissues

Easily add a Kanban board to any Github repo.
These are tracked using issues on a repository.

We use this at Pusher to triage and track project progress.

This is a rewrite of the [original version](https://github.com/pusher/icanhazissues)

![Kanban board] (images/kanban.png?raw=true)

### Running it locally

- Clone the repository
- Install all node dependencies using `npm install`
- You'll need to create a new Github application.
  Call it what ever you want, make sure the callback uri points to your local hostname and port
  Copy the secret and client ID
- Create an account with Pusher if you dont have one and copy the credentials
- Also make sure that **client events are enabled**
- Create a `config.json` in the root directory
    This must contain the following fields:

    ```json
    {
      "githubClientId": "your client id",
      "githubClientSecret": "your client secret",
      "githubState": "random string to prevent XSS",
      "cookieSecret": "random string to sign the cookies with",
      "boardColumns": ["ready", "development", "review", "release", "done"],
      "pusherAppId": "pusher app id",
      "pusherKey": "pusher key",
      "pusherSecret": "pusher secret",
      "eventinatorKey": "eventinator key",
      "githubRedirectUri": "your redirect uri for oAuth"
    }

    ```
    Alternatively you may set node environment variables for each of the above
    ```
    GITHUB_CLIENT_ID
    GITHUB_CLIENT_ID
    GITHUB_STATE
    PUSHER_APP_ID
    PUSHER_KEY
    PUSHER_SECRET
    EVENTINATOR_KEY
    GITHUB_OAUTH_REDIRECT_URI
    ```
- Run `node ./bin/www` to run the express app.

### Gulp tasks

This project uses Gulp to perform some tasks on js and css files.
There are existing `watch` tasks that monitor files to update them as they are changed.

To run gulp, `./node_modules/.bin/gulp`
Let it run in the background, if you choose to.

### Pusher
- Issues are backed by pusher and synced in real time.

### To-do
- Write tests
- Make eventinator optional