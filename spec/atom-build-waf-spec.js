'use babel';

import fs from 'fs-extra';
import temp from 'temp';
import { vouch } from 'atom-build-spec-helpers';
import { provideBuilder } from '../lib/atom-build-waf';

describe('AtomBuildWaf', () => {
  let directory;
  let builder;
  const Builder = provideBuilder();

  beforeEach(() => {
    waitsForPromise(() => {
      return vouch(temp.mkdir, 'atom-build-waf-spec-')
        .then((dir) => vouch(fs.realpath, dir))
        .then((dir) => (directory = `${dir}/`))
        .then((dir) => builder = new Builder(dir));
    });
  });

  afterEach(() => {
    fs.removeSync(directory);
  });

  describe('when wscript exists', () => {
    beforeEach(() => {
      fs.writeFileSync(directory + 'wscript', fs.readFileSync(`${__dirname}/wscript`));
    });

    it('should be eligible', () => {
      expect(builder.isEligible(directory)).toBe(true);
    });

    it('should list the default targets', () => {
      waitsForPromise(() => {
        return Promise.resolve(builder.settings(directory)).then((settings) => {
        expect(settings.length).toBe(3); // default, configure, clean

        const defaultTarget = settings[0]; // default MUST be first
        expect(defaultTarget.name).toBe('Waf: default (no target)');
        expect(defaultTarget.exec).toBe('waf');
        expect(defaultTarget.sh).toBe(false);

        const configureTarget = settings[1]; // configure will be second
        expect(configureTarget.name).toBe('Waf: configure');
        expect(configureTarget.exec).toBe('waf');
        expect(configureTarget.args).toEqual([ 'configure' ]);
        expect(configureTarget.sh).toBe(false);

        const cleanTarget = settings[2]; // clean will be third
        expect(cleanTarget.name).toBe('Waf: clean');
        expect(cleanTarget.exec).toBe('waf');
        expect(cleanTarget.args).toEqual([ 'clean' ]);
        expect(cleanTarget.sh).toBe(false);
        });
      });
    });
  });

  describe('when wscript does not exist', () => {
    it('should not be eligible', () => {
      expect(builder.isEligible(directory)).toBe(false);
    });
  });

});
