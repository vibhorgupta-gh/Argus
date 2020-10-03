# Argus

## About the Project

### Overview and Intent

**Argus automatically updates your running Docker containers to the latest available image.**
The problem with image and container management manually, especially in an environment where containers are running across servers and could need frequent updations due to latest images being pushed to the registry, is the plethora of tedious docker CLI commands required to run an updated container:

```
docker stop ...
docker rm ...
docker pull ...
docker run ...
```

If you wish to cleanup redundant images, again `docker rmi -f`.

### What it does

Argus automates the process of updating the Docker container on the basis of the latest image available image locally or in your image registry. Let's assume the developer is publishing new versions of a Docker image consistently for an application that is deployed and running in Docker containers on the local/remote servers. In this case, the developer needs a way to propogate this image change to somehow the remote servers, but that's not all. Even after secure shell access into these servers, the developer needs to stop the existing container, docker pull the latest image and start the container with original configs and the new image as the base image within the server shell. This requires multiple (and often tedious) docker commands on the CLI. Moreover, if they wish to cleanup the out of date images and containers from the server, running pruning commands takes even more commands.

Argus provides a solution to this predicament by automating the process of watching your containers, finding the underlying latest images (if any) locally and on a remote registry, gracefully quitting the running container, running a docker pull and thereafter creating and running a new container with the updated base image. This ensures that the service will keep track of new versions and will automatically update dockerized environments, remote servers in this context.

### Tech Stack

- [Typescript](https://www.typescriptlang.org/)
- [Jest](https://jestjs.io/)
- [Yarn](https://classic.yarnpkg.com/en/docs/)

### Getting Started :zap:

Ensure you have the Docker engine installed and running. To setup a local copy, follow these simple steps.

### Installation

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

### Running test suites

```
yarn run test
```

## Contributing

Any and all contributions are welcome!

1. Fork the Project
2. Create your feature breanch: `git checkout -b feature-branch`
3. Commit your Changes: `git commit -m "Add some cool feature"`
4. Push to your fork: `git push origin feature-branch`
5. Open a Pull Request.

## Future Plans :tada:

1. Create a roadmap for `Argus v1.0.0`
2. Figure out communication with remote servers
3. Add customisability to the tool via CLI options
4. Containerize the tool
5. Publish as a package

_Note_: You can check out Issue tracker and ongoing projects to look for existing issues and start contributing!
