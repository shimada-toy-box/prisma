import { getConfig } from '../..'
import { isRustPanic } from '../../panic'

describe('getConfig', () => {
  test('should raise a Rust panic when given arguments of the wrong type', async () => {
    expect.assertions(1)

    try {
      // @ts-expect-error
      await getConfig({ datamodel: true })
    } catch (e) {
      const error = e as Error
      expect(isRustPanic(error)).toBe(true)
    }
  })

  test('empty config', async () => {
    const config = await getConfig({
      datamodel: `
      datasource db {
        provider = "sqlite"
        url      = "file:../hello.db"
      }
      
      model A {
        id Int @id
        name String
      }`,
    })

    expect(config.datasources).toHaveLength(1)
    expect(config.datasources[0].provider).toEqual('sqlite')
    expect(config.generators).toHaveLength(0)
    expect(config.warnings).toHaveLength(0)
    expect(config).toMatchSnapshot()
  })

  test('with generator and datasource', async () => {
    const config = await getConfig({
      datamodel: `
    datasource db {
      url = "file:dev.db"
      provider = "sqlite"
    }

    generator gen {
      provider = "fancy-provider"
      binaryTargets = ["native"]
    }

    model A {
      id Int @id
      name String
    }`,
    })

    expect(config.datasources).toHaveLength(1)
    expect(config.generators).toHaveLength(1)
    expect(config.warnings).toHaveLength(0)
    expect(config).toMatchSnapshot()
  })

  test('datasource with env var', async () => {
    process.env.TEST_POSTGRES_URI_FOR_DATASOURCE = 'postgres://user:password@something:5432/db'

    const config = await getConfig({
      datamodel: `
      datasource db {
        provider = "postgresql"
        url      = env("TEST_POSTGRES_URI_FOR_DATASOURCE")
      }
      `,
    })

    expect(config).toMatchSnapshot()
  })

  test('datasource with env var - ignoreEnvVarErrors', async () => {
    const config = await getConfig({
      ignoreEnvVarErrors: true,
      datamodel: `
      datasource db {
        provider = "postgresql"
        url      = env("SOMETHING-SOMETHING-1234")
      }
      `,
    })

    expect(config).toMatchSnapshot()
  })
  test('with engineType="binary"', async () => {
    const binaryConfig = await getConfig({
      datamodel: `
      datasource db {
        provider = "sqlite"
        url      = "file:../hello.db"
      }

      generator gen {
        provider = "fancy-provider"
        engineType = "binary"
      }

      model A {
        id Int @id
        name String
      }`,
    })

    expect(binaryConfig).toMatchInlineSnapshot(`
Object {
  "datasources": Array [
    Object {
      "activeProvider": "sqlite",
      "name": "db",
      "provider": "sqlite",
      "url": Object {
        "fromEnvVar": null,
        "value": "file:../hello.db",
      },
    },
  ],
  "generators": Array [
    Object {
      "binaryTargets": Array [],
      "config": Object {
        "engineType": "binary",
      },
      "name": "gen",
      "output": null,
      "previewFeatures": Array [],
      "provider": Object {
        "fromEnvVar": null,
        "value": "fancy-provider",
      },
    },
  ],
  "warnings": Array [],
}
`)
  })
  test('with engineType="library"', async () => {
    const libraryConfig = await getConfig({
      datamodel: `
      datasource db {
        provider = "sqlite"
        url      = "file:../hello.db"
      }

      generator gen {
        provider = "fancy-provider"
        engineType = "library"
      }

      model A {
        id Int @id
        name String
      }`,
    })

    expect(libraryConfig).toMatchInlineSnapshot(`
Object {
  "datasources": Array [
    Object {
      "activeProvider": "sqlite",
      "name": "db",
      "provider": "sqlite",
      "url": Object {
        "fromEnvVar": null,
        "value": "file:../hello.db",
      },
    },
  ],
  "generators": Array [
    Object {
      "binaryTargets": Array [],
      "config": Object {
        "engineType": "library",
      },
      "name": "gen",
      "output": null,
      "previewFeatures": Array [],
      "provider": Object {
        "fromEnvVar": null,
        "value": "fancy-provider",
      },
    },
  ],
  "warnings": Array [],
}
`)
  })
})
