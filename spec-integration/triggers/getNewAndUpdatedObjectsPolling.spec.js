/* eslint-disable no-unused-expressions */
const chai = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const logger = require('@elastic.io/component-logger')();
const trigger = require('../../lib/triggers/getNewAndUpdatedObjectsPolling.js');

const { expect } = chai;
chai.use(require('chai-as-promised'));

if (fs.existsSync('.env')) {
  // eslint-disable-next-line global-require
  require('dotenv').config();
}

let cfg;

// we set up a sinon spy on the emit function so that
// we can determine what data/errors are emitted.
const emitter = {
  emit: sinon.spy(),
  logger,
};

describe('Get New and Updated Objects Polling integration tests', () => {
  beforeEach(() => {
    cfg = {
      url: process.env.API_BASE_URI,
      username: process.env.UNAME,
      password: process.env.PASSWORD,
      objectType: 'posts',
      startTime: undefined,
      endTime: undefined,
    };
  });
  afterEach(() => {
    emitter.emit.resetHistory();
  });

  it('should successfully retrieve a list of objects within a given start and end time and emit a snapshot', async () => {
    cfg.startTime = '2019-03-17T16:33:08.809Z';
    cfg.endTime = '2019-06-11T05:09:22.308Z';

    await trigger.process.call(emitter, {}, cfg);
    expect(emitter.emit.calledThrice).to.be.true;
    expect(emitter.emit.firstCall.args[1].body).to.deep.equal({
      userId: 5,
      id: 50,
      title: 'repellendus qui recusandae incidunt voluptates tenetur qui omnis exercitationem',
      body: 'error suscipit maxime adipisci consequuntur recusandae\nvoluptas eligendi et est et voluptates\nquia distinctio ab amet quaerat molestiae et vitae\nadipisci impedit sequi nesciunt quis consectetur',
      created: '2019-03-17T16:33:08.809Z',
      lastModified: new Date('2019-03-17T16:33:08.809Z'),
    });
    expect(emitter.emit.secondCall.args[1].body).to.deep.equal({
      userId: 4,
      id: 32,
      title: 'doloremque illum aliquid sunt',
      body: 'deserunt eos nobis asperiores et hic\nest debitis repellat molestiae optio\nnihil ratione ut eos beatae quibusdam distinctio maiores\nearum voluptates et aut adipisci ea maiores voluptas maxime',
      created: '2019-06-11T05:09:22.308Z',
      lastModified: new Date('2019-06-11T05:09:22.308Z'),
    });
    expect(emitter.emit.thirdCall.args[1]).to.deep.equal({
      startTime: '2019-06-11T05:09:22.308Z',
    });
  });

  it('should successfully retrieve a list of objects after a snapshot', async () => {
    cfg.pollConfig = 'created';
    const snapshot = { startTime: '2019-06-11T05:09:22.308Z' };

    await trigger.process.call(emitter, {}, cfg, snapshot);
    expect(emitter.emit.calledTwice).to.be.true;
    expect(emitter.emit.firstCall.args[1].body).to.deep.equal({
      userId: 5,
      id: 45,
      title: 'ut numquam possimus omnis eius suscipit laudantium iure',
      body: 'est natus reiciendis nihil possimus aut provident\n'
        + 'ex et dolor\n'
        + 'repellat pariatur est\n'
        + 'nobis rerum repellendus dolorem autem',
      created: new Date('2019-12-03T11:20:32.637Z'),
      lastModified: '2019-12-03T11:20:32.637Z',
    });
    expect(emitter.emit.secondCall.args[1]).to.deep.equal({
      startTime: '2019-12-03T11:20:32.637Z',
    });
  });
});
