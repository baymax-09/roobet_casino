<div id="top"></div>
<br />
<div align="center">
  <a href="https://roobet.com">
    <img src="https://roobet.com/images/logomark.svg" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Roobet</h3>

  <p align="center">
    Backend
    <br />
    <a href="https://roobetapp.atlassian.net/wiki/spaces/EN/overview">Explore the docs »</a>
    .
    <a href="https://roobetapp.atlassian.net/servicedesk/customer/portal/3/group/14">Report Bug »</a>
    ·
    <a href="https://roobetapp.atlassian.net/servicedesk/customer/portal/3/group/14">Request Feature »</a>
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#seed">Seed</a></li>
        <li><a href="#running-the-dev-environment">Running the Dev Environment</a></li>
      </ul>
    </li>
    <li>
      <a href="#contributing">Contributing</a>
      <ul>
        <li><a href="#testing">Testing</a></li>
      </ul>
    </li>
  </ol>
</details>

## About The Project

### Built With

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [Nexus.js](https://nexusjs.org/)
- [RethinkDB](https://rethinkdb.com/)
- [MongoDB](https://www.mongodb.com/)

<p align="right">(<a href="#top">back to top</a>)</p>

## Getting Started

To get a local copy up and running follow these simple example steps.

### Prerequisites

We require the use of an encrypted volume or that your whole disk be encrypted.

- MacOS: `APFS (Case-sensitive, Encrypted)`
- Rosetta 2
  - If your systems is running apple silicon (M1/2) you'll need Rosetta 2 installed.
    You can install it by running the following command in your terminal:
    `softwareupdatesoftwareupdate --install-rosetta --agree-to-license`
  - See: https://stackoverflow.com/questions/73220580/bcrypt-lib-node-mach-o-file-but-is-an-incompatible-architecture-have-ar

### Installation

Locally, you will need to install:

- [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- [Docker](https://www.docker.com/products/docker-desktop)
  - MacOS w/ Homebrew: `brew install --cask docker`
  - Debian/Ubuntu: `sudo apt install docker`
- [AWS cli](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [gitleaks](https://github.com/zricethezav/gitleaks)
  - MacOS w/ Homebrew: `brew install gitleaks`
- [jsonnetfmt](https://jsonnet.org/learning/tools.html)
  - MacOS w/ Homebrew: `brew install jsonnet`
- [yamllint](https://yamllint.readthedocs.io/en/stable/)
  - MacOS w/ Homebrew: `brew install yamllint`

#### IMPORTANT

DO NOT USE Kubernetes inside Docker Desktop.
It will cause issues with network reachability due to higher levels of network isolation.

Make sure to run **BOTH** `nvm install` and `nvm use` in the project root to get the correct version of node.

Run `aws configure` to add your Roobet staging account profile to your user directory.

### Env Variables

Run the command: `cp .env.template .env`

### DNS Routing

We have DNS Routing to allow us to test multiple domains locally, such as: pambet.test, ca.pambet.test, etc.
Run the following command: `./scripts/addDnsResolver.sh`

Your local domain names will be changed:

- from `localhost:9000` to `pambet.test `
- from `localhost:9001` to `x.pambet.test`

### Seed

You'll need to have the backend running for the seed step to work.

The following is the set of commands to run to get the backend up and running.
You can skip the ones you've already run, if the order is correct.

```sh
nvm install           # install node version
nvm use               # use node version
npm install           # install dependencies
docker compose up -d  # start rethinkdb, mongodb, rabbitmq, etc.
```

To quick start your environment with test data, run the default seed script:

```sh
WORKER=migrate npm run dev # create dbs, schemas, and collections; if necessary
npm run seed:default
```

To get an overview of what data is being written, see [`seedData.ts`](scripts/data/seedData.ts).
Additional seed data files may be written and used with the script.
Use the `seed:default` script in [`package.json`](package.json) as a reference.

### Running the Dev Environment

#### MacOS + Linux

1. Clone repository
2. `cd` to project root
3. `nvm install` and `nvm use` to set node/npm version
4. `npm i` to install dependencies
5. `npm run dev` to run the dev server

#### Windows

**IMPORTANT**

#### docker, repo => _both_ on WSL2

^ Failure to do this will cause massive slowdowns to the point of unusability.

1. Docker Desktop -> Settings -> General
   - enable `Use the WSL2 based engine`
   - enable `Use Docker Compose V2`
2. Install preferred flavor of WSL2
   - this procedure was written against [Ubuntu App for Windows](https://www.microsoft.com/store/productId/9NBLGGH4MSV6)
3. Install [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) (not nvm for Windows)
   - you may need to restart the WSL2 terminal for the `nvm` command to work
4. `ssh-keygen` within WSL2 or [copy](https://devblogs.microsoft.com/commandline/sharing-ssh-keys-between-windows-and-wsl-2/) git keys into WSL2, if necessary

Then follow MacOS/Linux instructions above _STRICTLY_ from within WSL2

---

<p align="right">(<a href="#top">back to top</a>)</p>

## Contributing

Check out the [Roobet Knowledgebase](https://roobetapp.atlassian.net/wiki/spaces/EN/overview) for the latest on coding standards and our development lifecycle.

### Testing

`npm test` runs the whole test suite. takes a while to set up initially.

To test a specific test file just do something like:
`npm test -- --grep softswiss`

<p align="right">(<a href="#top">back to top</a>)</p>
