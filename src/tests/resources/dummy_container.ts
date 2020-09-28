export const dummy_container = {
    "Hostname": "",
    "Domainname": "",
    "User": "",
    "AttachStdin": false,
    "AttachStdout": true,
    "AttachStderr": true,
    "Tty": false,
    "OpenStdin": false,
    "StdinOnce": false,
    "Env": [
      "FOO=bar",
      "BAZ=quux"
    ],
    "Cmd": [
      "date"
    ],
    "Entrypoint": "",
    "Image": "ubuntu",
    "Labels": {
      "com.example.vendor": "Acme",
      "com.example.license": "GPL",
      "com.example.version": "1.0"
    },
    "Volumes": {
      "/volumes/data": {}
    },
    "WorkingDir": "",
    "NetworkDisabled": false,
    "MacAddress": "12:34:56:78:9a:bc",
    "ExposedPorts": {
      "22/tcp": {}
    },
    "StopSignal": "SIGTERM",
    "StopTimeout": 10,
    "HostConfig": {
      "Binds": [
        "/tmp:/tmp"
      ],
      "Links": [
        "redis3:redis"
      ],
      "Memory": 0,
      "MemorySwap": 0,
      "MemoryReservation": 0,
      "KernelMemory": 0,
      "NanoCPUs": 500000,
      "CpuPercent": 80,
      "CpuShares": 512,
      "CpuPeriod": 100000,
      "CpuRealtimePeriod": 1000000,
      "CpuRealtimeRuntime": 10000,
      "CpuQuota": 50000,
      "CpusetCpus": "0,1",
      "CpusetMems": "0,1",
      "MaximumIOps": 0,
      "MaximumIOBps": 0,
      "BlkioWeight": 300,
      "BlkioWeightDevice": [
        {}
      ],
      "BlkioDeviceReadBps": [
        {}
      ],
      "BlkioDeviceReadIOps": [
        {}
      ],
      "BlkioDeviceWriteBps": [
        {}
      ],
      "BlkioDeviceWriteIOps": [
        {}
      ],
      "MemorySwappiness": 60,
      "OomKillDisable": false,
      "OomScoreAdj": 500,
      "PidMode": "",
      "PidsLimit": -1,
      "PortBindings": {
        "22/tcp": [
          {
            "HostPort": "11022"
          }
        ]
      },
      "PublishAllPorts": false,
      "Privileged": false,
      "ReadonlyRootfs": false,
      "Dns": [
        "8.8.8.8"
      ],
      "DnsOptions": [
        ""
      ],
      "DnsSearch": [
        ""
      ],
      "VolumesFrom": [
        "parent",
        "other:ro"
      ],
      "CapAdd": [
        "NET_ADMIN"
      ],
      "CapDrop": [
        "MKNOD"
      ],
      "GroupAdd": [
        "newgroup"
      ],
      "RestartPolicy": {
        "Name": "",
        "MaximumRetryCount": 0
      },
      "AutoRemove": true,
      "NetworkMode": "bridge",
      "Devices": [],
      "Ulimits": [
        {}
      ],
      "LogConfig": {
        "Type": "json-file",
        "Config": {}
      },
      "SecurityOpt": [],
      "StorageOpt": {},
      "CgroupParent": "",
      "VolumeDriver": "",
      "ShmSize": 67108864
    },
    "NetworkingConfig": {
      "EndpointsConfig": {
        "isolated_nw": {
          "IPAMConfig": {
            "IPv4Address": "172.20.30.33",
            "IPv6Address": "2001:db8:abcd::3033",
            "LinkLocalIPs": [
              "169.254.34.68",
              "fe80::3468"
            ]
          },
          "Links": [
            "container_1",
            "container_2"
          ],
          "Aliases": [
            "server_x",
            "server_y"
          ]
        }
      }
    }
  }