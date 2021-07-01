# Argus

![Argus](https://socialify.git.ci/VibhorCodecianGupta/Argus/image?description=1&language=1&pattern=Circuit%20Board&stargazers=1&theme=Light)

## Overview and Intent

A TypeScript-based alternative to [watchtower](https://github.com/v2tec/watchtower)

**Argus automatically updates your running Docker containers to the latest available image.**
The problem with managing docker images and containers manually, especially in an environment where containers are running across servers and need frequent updates due to constant images updates to the registry, is a series of CLI commands needed to update and rerun a container which quickly gets tiresome:

```
docker stop ...
docker rm ...
docker pull ...
docker run ...
```

Additionally, if you wish to cleanup redundant images, again `docker rmi -f ...`.

Argus automates the job of updating Docker containers in favour of latest images available in an image registry. Assuming a developer is publishing new versions of a Docker image frequently for an application that resides in containers deployed on local/remote servers, the dev needs a way to propogate the image update to these containers. Traditionally, after SSHing in the remote machine the dev has to stop the existing container, pull the latest image as base, and restart the container. The entire process requires running a series of commands that get tedious, quick.

Automating the process of watching your containers, looking for latest images on a remote registry, exiting the running container, pulling the latest image and running a new container with the updated base ensures keeping up to date with newer, stable versions.

---

## Usage

**NPM package**

`Argus` is available in the npm registry as a package. To use:

`yarn global add argus-docker` or `npm i -g argus-docker`

**Docker Image**

`Argus` is also deployed via docker image like so:

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus
```

- Remove the `-d` flag to run in foreground
- By default, running containers are polled every 300 seconds

### Options

All arguments can be used together without conflicts with the exception of `-u` and `-p`.

```
docker run --rm whaleit/argus --help
```

- `--host`, `-u`: Monitor and update containers on a remote system by providing its `host`. Defaults to `/var/run/docker.sock`
- `--interval`, `-i`: Change interval b/w Argus checking the remote docker registry for image updates (in seconds). Defaults to `300`
- `--monitor`, `-m`: Only monitor select containers by names. Defaults to all containers.
- `--ignore`, `-ig`: Ignore only select containers by names. Defaults to none.
- `--runonce`, `-r`: Update all running containers once and terminate. Defaults to `false`.
- `--cleanup`, `-c`: Remove the older base image if a new one is found and updated. Defaults to `false`.
- `--user`, `-u`: Specify username for private image registry. Defaults to `null`.
- `--password`, `-p`: Specify password for private image registry. Defaults to `null`.
- `--smtp-host`, `-H`: Specify SMTP relay hostname for email notifications. Defaults to `null`.
- `--smtp-port`, `-I`: Specify SMTP relay port for email notifications. Defaults to `null`.
- `--smtp-username`, `-U`: Specify SMTP relay username to login SMTP server. Defaults to `null`.
- `--smtp-password`, `-G`: Specify SMTP relay password to login SMTP server. Defaults to `null`.
- `--smtp-sender`, `-j`: Specify sender's email account for email notification. Defaults to `null`.
- `--smtp-recipients`, `-J`: Specify all recipients' comma separated email accounts for email notification. Defaults to `null`.
- `--webhook-urls`, `-w`: Specify comma separated Webhook urls to HTTP POST broadcast notifications to various platforms (supports Slack, Discord, Telegram, Pushover). Defaults to `null`.
- `--pushover-token`, `-pt`: Specify Pushover App Token to broadcast notifications to your Pushover client. Defaults to `null`.
- `--pushover-user`, `-pu`: Specify Pushover User Key to broadcast notifications to your Pushover client. Defaults to `null`.
- `--pushover-device`, `-pd`: Specify Pushover device to broadcast notifications to your Pushover client. Defaults to `null`.
- `--telegram-token`, `-tt`: Specify Telegram bot Token to broadcast notifications to Telegram. Defaults to `null`.
- `--telegram-chat`, `-tc`: Specify Telegram Chat ID to broadcast notifications to Telegram. Defaults to `null`.
- `--prometheus-host`, `-ph`: Specify server hostname for Prometheus to scrape metrics from. Defaults to `null`.
- `--prometheus-port`, `-pi`: Specify server port for Prometheus to scrape metrics from. Defaults to `null`.
- `--influx-url`, `-iu`: Specify url where InfluxDB is exposed. Defaults to `null`.
- `--influx-token`, `-it`: Specify InfluxDB auth token for your organisation. Defaults to `null`.
- `--influx-org`, `-io`: Specify InfluxDB organisation. Defaults to `null`.
- `--influx-bucket`, `-ib`: Specify InfluxDB bucket for your organisation. Defaults to `null`.

**Using related flags:**

- `-u` and `-p` flags are to be used in conjunction as credentials in case of private image registry.
- `-H`, `-I`, `-U`,`-G`, `-j` and `-J`are to be used in conjunction as SMTP server credentials and sender/recipients in case of broadcasting notifications via email.
- `w`, `-pt`, `-pu` and `-pd` are to be used in conjunction in case of broadcasting notifications to Pushover.
- `w`, `-tt` and `-tc` are to be used in conjunction in case of broadcasting notifications to Telegram.
- `w`, `-ph` and `-pi` are to be used in conjunction in case of exporting data to Prometheus.
- `-iu`, `-it`, `-io` and `-ib` are to be used in conjunction in case of writing data to InfluxDB

---

## Examples

### Update containers on a remote host

Argus can monitor things other than just local, pass the `--host` argument to update a system with the Docker API exposed.

Defaults to `/var/run/docker.sock`

1. Running the docker image

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus --host='tcp://some-remote-docker-server:2375'
```

2. Running the npm package

```bash
argus --host='tcp://some-remote-docker-server:2375'
```

### Change update interval

An `interval` argument can be supplied to change interval b/w argus checking the remote docker registry for image updates (in seconds).

Defaults to `300` seconds

1. Running the docker image

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus --interval=900
```

2. Running the npm package

```bash
argus --interval=900
```

### Monitor select containers

Argus monitors all running docker containers, but can be overridden to only monitor select containers by passing `monitor` supplied with container names.

Defaults to all containers

1. Running the docker image

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus --monitor='containerA','containerB','containerC'
```

2. Running the npm package

```bash
argus --monitor='containerA','containerB','containerC'
```

### Ignore select containers

Argus monitors all running docker containers, but can be overridden to ignore select containers by passing `ignore` supplied with container names.

Defaults to none

1. Running the docker image

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus --ignore='containerA','containerB'
```

2. Running the npm package

```bash
argus --ignore='containerA','containerB'
```

### Update all containers once and quit

If you prefer Argus didn't run all the time and only update running containers once and exit, use the `runonce` argument and Argus terminates after updating all containers once.

Defaults to `false`

1. Running the docker image

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus --runonce=true
```

2. Running the npm package

```bash
argus --runonce=true
```

### Remove old docker images

Argus has the option to remove the outdated base image if a new one is found and the container is updated. To clean up after updates, pass the `cleanup` argument.

Defaults to `false`

1. Running the docker image

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus --cleanup=true
```

2. Running the npm package

```bash
argus --cleanup=true
```

### Private Registries

If base images to running containers are stored in a secure registry that requires credentials, you can run Argus with 2 arguments `--user` and `--password`.

1. Running the docker image

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus --user='myUser' --password='myPassword'
```

2. Running the npm package

```bash
argus --user='myUser' --password='myPassword'
```

Credentials can also be passed via environment variables. Set the environment vars in your command line environment prior to running Argus like so:

```bash
export REPO_USER=myUser
export REPO_PASS=myPassword
```

### Email notifications

Argus can send notifications to subscribers via email, detailing about the count of containers being updated and their new hashes.

1. Running the docker image

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus --smtp-host='smtp.gmail.com' --smtp-port='587' --smtp-username='someaccount@gmail.com' --smtp-password='someaccountpass' --smtp-recipients='somereceiver@gmail.com,anotherreceiver@gmail.com' --smtp-sender='somesender@gmail.com'
```

2. Running the npm package

```bash
argus --smtp-host='smtp.gmail.com' --smtp-port='587' --smtp-username='someaccount@gmail.com' --smtp-password='someaccountpass' --smtp-recipients='somereceiver@gmail.com,anotherreceiver@gmail.com' --smtp-sender='somesender@gmail.com'
```

### Webhook notifications

Argus can broadcast notifiations to various platforms that support webhook POST urls, detailing about the count of containers being updated and their new hashes. Following platforms are supported (You're free to request for more platforms, preferably ones supporting webhooks):

- Slack
- Telegram
- Discord
- Pushover

Each of these platforms requires separate flags with platform specific information that can be passed independant of any other in this list. Webhook URLs, however, have to be necessarily passed in specifying comma separated webhook URL strings of said platforms.
The pre-requisite is to register apps (Pushover, Slack)/ bots (Telegram)/ servers (Discord) and obtaining their webhook URLs.

1. Running the docker image

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus --webhook-urls='https://discord.com/api/webhooks/some-url','https://hooks.slack.com/services/some-url' --pushover-token='<pushover_token>' --pushover-user='<pushover_user_key>' --pushover-device='<pushover_device>' --telegram-token='<identifier>:<token>' --telegram-chat='<telegram_chat_id>'
```

2. Running the npm package

```bash
argus --smtp-host='smtp.gmail.com' --smtp-port='587' --smtp-username='someaccount@gmail.com' --smtp-password='someaccountpass' --smtp-recipients='somereceiver@gmail.com,anotherreceiver@gmail.com' --smtp-sender='somesender@gmail.com'
```

### Prometheus metrics

Argus is enabled with Prometheus data exporter from which Prometheus can scrape for metrics. Argus fires up a server for Prometheus to attach to, hostname and port being specified by the user. Prometheus is disabled by default if no hostname and port is found.

1. Running the docker image

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus --prometheus-host='http://127.0.0.1' --prometheus-port='8000'
```

2. Running the npm package

```bash
argus --prometheus-host='http://127.0.0.1' --prometheus-port='8000'
```

You can also easily set up a Grafana dashboard for said metrics captured which require miniamal changes to `promotheus.yml` config file on your system, and configuring your Grafana subdomain accordingly. **An importable Grafana dashboard template is coming soon.**

### InfluxDB metrics

Argus is enabled with InfluxDB client which can write data to your local or hosted Influx service. User needs to start the Influx service and specify above mentioned parameters to activate influx exporter. InfluxDB is disabled by default if no URL and token is found.

1. Running the docker image

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus  --influx-token='<your_token>' --influx-url='http://127.0.0.1:8086/' --influx-org='<your_org>' --influx-bucket='<your_bucket>'
```

2. Running the npm package

```bash
argus --influx-token='<your_token>' --influx-url='http://127.0.0.1:8086/' --influx-org='<your_org>' --influx-bucket='<your_bucket>'
```

You can easily query the data written by Argus in either the influx CLI or the dashboard UI (live on your influx-url) to observe metrics. You an also use the influx client libraries to query this data in your applications.

---

## Development

Argus is built with [Typescript](https://www.typescriptlang.org/) and utilizes this [Docker SDK](https://github.com/apocas/dockerode).

### Installation

Ensure you have the Docker engine installed and running. To setup a local copy, follow these simple steps.

```
npm i -g typescript
git clone https://github.com/VibhorCodecianGupta/Argus.git
yarn install
```

### Running a prod build

```
yarn run build
yarn run start
```

### Running in dev mode

```
yarn run dev
```

---

## Contributing

Any and all contributions are welcome. You can check out Issue tracker and ongoing projects to look for existing issues and start contributing.

Feel free to open issues for any bugs you discover or any feature ideas you have. Do make sure to open an issue before moving to implementation. This ensures sufficient discussion and context to incoming PRs.

1. Fork the Project
2. Create your feature breanch: `git checkout -b feature-branch`
3. Commit your Changes: `git commit -m "Add some feature"`
4. Push to your fork: `git push origin feature-branch`
5. Open a Pull Request.

If you like what you see, leave a star :)
