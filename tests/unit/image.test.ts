import { Image } from '../../src/image';
import { dummy_images } from '../resources/dummy_images';
import {
  dummy_inspect_response,
  dummy_updated_inspect_response,
} from '../resources/dummy_inspect';

describe('Image Client', () => {
  const imageData = dummy_inspect_response;
  const MockDockerClient = {
    listImages: () =>
      new Promise((resolve, reject) => {
        resolve(dummy_images);
      }),
    getImage: (name: string) => {
      if (name === 'test' || name === 'example:latest')
        return new Promise((resolve, reject) => {
          resolve({ inspect: () => new Promise((res, rej) => res(imageData)) });
        });
      return undefined;
    },
    pull: (name: string) => {
      const modem = {
        followProgress: () => {
          return new Promise((resolve, reject) => {
            resolve({
              inspect: () => new Promise((res, rej) => res(imageData)),
            });
          });
        },
      };
      if (name === 'example:latest') {
        return new Promise((resolve, reject) => {
          resolve(modem.followProgress);
        });
      }
      return undefined;
    },
  };
  const ImageClient = new Image(MockDockerClient);

  test('list all images', async () => {
    expect.assertions(1);
    const images = await ImageClient.listAll();
    expect(images).toEqual(dummy_images);
  });

  let imageInfo: any;
  test('inspect image', async () => {
    expect.assertions(1);
    imageInfo = await ImageClient.inspect('test');
    expect(imageInfo).toEqual(dummy_inspect_response);
  });

  test('pull latest image', async () => {
    expect.assertions(3);
    const latestImageInfo = await ImageClient.pullLatestImage(
      imageInfo,
      undefined
    );
    expect(latestImageInfo).toEqual(dummy_updated_inspect_response);
  }, 8000);

  describe('isUpdated', () => {
    test('when inputs match', () => {
      expect(Image.isUpdatedImage('abc', 'abc')).toBe(true);
    });
    test('when inputs do not match', () => {
      expect(Image.isUpdatedImage('abc', 'def')).toBe(false);
    });
  });
});
