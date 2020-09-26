import { Image } from "./image";
import { Container } from "./container";


async function executeArgus() : Promise<void> {
  const images = await Image.listAll();

  const source = images ? images[0] : { 'RepoTags': [ 'test_tag' ] };
  const sourceName = source.RepoTags[0];

  const containerOptions = {
    name: 'Test',
    image: sourceName,
    command: ["bash"],
    hostConfig: {},
    labels: {},
    entrypoint: "",
    environment: []
  }

  const container = new Container(containerOptions);
  const new_container = await container.create();

  console.log(new_container ? new_container['id'] : `Container not created`);

}


executeArgus();

