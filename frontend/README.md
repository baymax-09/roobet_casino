<div id="top"></div>
<br />
<div align="center">
  <a href="https://roobet.com">
    <img src="https://roobet.com/images/logomark.svg" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Roobet</h3>

  <p align="center">
    Frontend
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
        <li><a href="#running-the-dev-environment">Running the Dev Environment</a></li>
        <li><a href="#language-keys">Language Keys</a></li>
        <li><a href="#vendor-exporting">Vendor Exporting</a></li>
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

- [React.js](https://reactjs.org/)
- [Apollo GQL Client](https://www.apollographql.com/docs/react/)
- [Redux](https://redux.js.org/)
- [MaterialUI](https://v4.mui.com/)

<p align="right">(<a href="#top">back to top</a>)</p>

## Getting Started

To get a local copy up and running follow these simple example steps.

### Prerequisites

We require the use of an encrypted volume or that your whole disk be encrypted.

- MacOS: `APFS (Case-sensitive, Encrypted)`

### Installation

Locally, you will need to install:

- [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- [Docker](https://www.docker.com/products/docker-desktop)
  - MacOS w/ Homebrew: `brew install --cask docker`
  - Debian/Ubuntu: `sudo apt install docker`
- [AWS cli](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [gitleaks](https://github.com/zricethezav/gitleaks)
  - MacOS w/ Homebrew: `brew install gitleaks`
- [yamllint](https://yamllint.readthedocs.io/en/stable/)
  - MacOS w/ Homebrew: `brew install yamllint`

Make sure to run `nvm use` in the project root to get the correct version of node.

Run `aws configure` to add your Roobet staging account profile to your user directory.

#### Env Variables

Run the command: `cp .env.template .env`

We have an environment variable, `NPM_PGK_GITHUB_TOKEN`, that's required for installing our `@project-atl/ui` Github package.
You will need to create a PAT in Github that has package read access to install our `@project-atl/ui` package properly.
Check out the documentation here for setting up your PAT: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
Once you have your PAT created, set the env variable as shown below:

```
export NPM_PGK_GITHUB_TOKEN=<your-token-goes-here>
```

### Running the Dev Environment

#### MacOS + Linux

1. Clone repository
2. `cd` to project root
3. `nvm install` and `nvm use` to set node/npm version
4. `npm i` to install dependencies
5. `npm run dev` to run the dev server

##### Tips

- If the frontend gives errors like:

  - `OneSignal: This web push config can only be used on http://roobet.test. Your current origin is http://localhost:9000`

    OR

    `OneSignal: This web push config can only be used on http://roobet.test. Your current origin is http://roobet.test:9000`

    Ensure the backend proxy service (`roobet-proxy`) is up and running in Docker. If it is, try restarting it.

    This command can show the status of the proxy service: `docker ps --filter "name=roobet-proxy" --format='"{{.ID}}" "{{.Names}}" "{{.Status}}""' | awk '{print $1" "$2" "$3 "\""}'`

### Language Keys

We are using the library [react-i18Next](https://react.i18next.com/) for our internationalization.
We are also doing static analysis on our code to make sure all keys in code exist in the translation files.

Our translation files look like this (this is currently a WIP, there are some keys no longer in use 12/16/2021):

To add a new translation simply go to [`src/app/locale/en.json`]('src/app/locale/en.json')

Copy should follow the following rules, if it is not a sentence then it should be a camel-cased version of the word(s).
If it is too many words for that not to make sense then simple postfix with "Text" or "Desc" example "rollDiceText" could be "Roll the dice for a chance to win!"

```
  "diceRoute": {
    "reset": "Reset",
    "betAmount": "Bet Amount",
    "automated": "Automated",
    "winChance": "Win Chance",
    "increaseBy": "Increase By",
    "manual": "Manual",
    "numberOfBets": "Number of Bets",
    ...
  }
```

In CI if a key exists in code that does not exist in translation files your build will fail.
The keys being compared are generated in `locale_key_compare.json`

This also does a diff on keys that existed the last time it ran and adds that to .old file.
This can be used to find keys in the map that are no longer used.

The script for this can be found in `scripts/compare_keys.js` and the configuration for the parser is found in `i18next_parser.js`

NOTE: You may see some translation keys as plain strings that are going to be translated in a .map (like tabs).
These will have a comment above them like this: `// t('tabs.dice')`.
This is so our parser can find the key and add it to our missing key checker.

### Vendor Exporting

You can export specific vendors in separate files and load them separately.
All vendors included in `app/vendors/` will be exported to `dist/vendors/`.
The goal is to serve independent JS/CSS libraries, though all file formats are supported.

! Don't forget to add the vendors in `app/index.html` and `build/index.html`.

## Contributing

Check out the [Roobet Knowledgebase](https://roobetapp.atlassian.net/wiki/spaces/EN/overview) for the latest on coding standards and our development lifecycle.

### Testing

`npm test` runs the whole test suite. takes a while to set up initially.

To test a specific test file just do something like: `npm test -- --grep softswiss`

<p align="right">(<a href="#top">back to top</a>)</p>
