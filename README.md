### icanhazissues

Easily add a Kanban board to any Github repo.
These are tracked using issues on a repository.

We use this at Pusher to triage and track project progress.

This is a rewrite of the [original version](https://github.com/pusher/icanhazissues)

### Running it locally

- Clone the repository
- Install all node dependencies using `npm install`
- Create a `config.json` in the root directory.
- Run `npm start` to run the express app.

### Gulp tasks

This project uses Gulp to perform some tasks on js, react and css files.
There are existing `watch` tasks that monitor files to update them as they are changed.

To run gulp, `./node_modules/.bin/gulp`
Let it run in the background, if you choose to.
