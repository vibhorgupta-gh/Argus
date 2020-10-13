import {
    Container as ContainerInterface,
    ContainerInspectInfo,
} from 'dockerode';


export interface Arguments {
    [x: string]: unknown;
    runonce: boolean;
    cleanup: boolean;
    host: string | undefined;
    interval: number | undefined;
    monitor: (string | number)[] | undefined;
    $0: string;
}

export interface ConfigInterface {
    runOnce: boolean;
    cleanImages: boolean;
    dockerHost: string | undefined;
    watchInterval: number | undefined;
    containersToMonitor: (string | number)[] | undefined;
}

export interface RunningContainerInfo {
    inspectObject?: ContainerInspectInfo;
    interfaceObject?: ContainerInterface;
}
