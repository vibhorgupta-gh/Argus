import Docker from 'dockerode';
import { Container } from '../../container';
import { dummy_container } from '../resources/dummy_container';
import { dummy_container_response } from '../resources/dummy_container';


const DockerClient = new Docker();
const ContainerClient = new Container(DockerClient);

let newContainer: any;

beforeEach(() => {
    // Stopping all previously running containers
    DockerClient.listContainers((err, containers) => {
        if(containers){
            containers.forEach((container) => {
                DockerClient.getContainer(container.Id).stop();
            })
        }
       
    })

    // Creating a new container
     newContainer = ContainerClient.create(dummy_container)
})

test('check if container is running', async () => {

    await Container.start(newContainer);

    const containers = await ContainerClient.getRunningContainers();
    if(containers){
        expect(containers.length).toBe(1);
        expect(containers[0]).toEqual(dummy_container_response[0]);
    } else {
        throw new Error('No containers running');
    }   
})

test('start a container', async () => {

    await Container.start(newContainer);
    const containers = await ContainerClient.getRunningContainers();

    if(containers){
        expect(containers[0].State).toBe("running")
    }
})

test('stop a container', async() => {
    
    await Container.start(newContainer);
    await Container.stop(newContainer);
    const containers = await ContainerClient.getRunningContainers();

    if(containers){
        expect(containers[0].State).toBe("exited");
    }
})

test('remove a container', async() => {

    Container.remove(newContainer);
    expect(DockerClient.listContainers.length).toBe(0);

})