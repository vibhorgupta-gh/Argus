import { Container } from '../../src/container';
import { dummy_container } from '../resources/dummy_container';
import { dummy_info } from '../resources/dummy_info';
import { dummy_container_responses } from '../resources/dummy_container_response';

describe('Container Client', () => {
  const MockDockerClient = {
    listContainers: (opts: any) =>
      new Promise((resolve, reject) => {
        resolve(dummy_info);
      }),

    createContainer: (opts: any) =>
      new Promise((resolve, reject) => {
        resolve(dummy_container);
      }),

    getContainer: (id: any) =>
      new Promise((resolve, reject) => {
        resolve({
          inspect: () => new Promise((res) => res(dummy_container)),
        });
      }),
  };

  const containerClient = new Container(MockDockerClient);

  test('creating a container', async () => {
    const container = await containerClient.create(dummy_container);
    expect(container).toEqual(dummy_container);
  });
});
