import Docker from 'dockerode';
import { Container } from '../../container';
import { dummy_container } from '../resources/dummy_container';
import { dummy_info } from '../resources/dummy_info';
import { dummy_container_responses } from '../resources/dummy_container_response';


const DockerClient = new Docker();
const ContainerClient = new Container(DockerClient);

describe('Container Client', () => {
    let containerData = dummy_container_responses;
    const MockDockerClient = {
        listContainers: (opts: any) => new Promise((resolve, reject) => {
            resolve(dummy_info);
        }),

        createContainer: (opts:any) => new Promise((resolve, reject)=> {
            resolve(dummy_container);
        }),

        getContainer: (id: any) => new Promise((resolve, reject) => {
            resolve({
                inspect: () => new Promise(res => res(dummy_container))
            });
        })
    }

    const containerClient = new Container(MockDockerClient);

    test('creating a container', async()=> {
    const container = await containerClient.create(dummy_container)
    expect(container).toEqual(dummy_container)
})

    test('starting a container', async() => {
        // const container = await containerClient.create(dummy_container);
        const containers = await containerClient.getRunningContainers()

        if(containers){
            expect(containers[0]).toEqual(dummy_container)
        } else{
            throw new Error('Cannot find running containers')
        }
       
       
        
    })
}) 


