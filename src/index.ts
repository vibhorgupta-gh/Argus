import Docker from 'dockerode';
import { Image } from "./image";
import { Container } from "./container";

const DockerClient = new Docker();

const ImageClient = new Image(DockerClient);
const ContainerClient = new Container(DockerClient);


async function executeArgus() : Promise<void> {
  //const images = await ImageClient.listAll();

  //const source = images ? images[0] : { 'RepoTags': [ 'test_tag' ] };
  //const sourceName = source.RepoTags[0];

  //const containerOptions = {
  //  name: 'Test',
  //  image: sourceName,
  //  command: ["bash"],
  //  hostConfig: {},
  //  labels: {},
  //  entrypoint: "",
  //  environment: []
  //}

  //const container = new Container(containerOptions);
  //const new_container = await container.create();

  //console.log(new_container ? new_container['id'] : `Container not created`);

  const containers = await ContainerClient.getRunningContainers()
}



executeArgus();

