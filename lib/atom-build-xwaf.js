'use babel';

import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import voucher from 'voucher';
import { EventEmitter } from 'events';

var Finder = require('fs-finder');

export const config = {
  jobs: {
    title: 'Simultaneous jobs',
    description: 'Limits how many jobs xwaf will run simultaneously. Defaults to number of processors. Set to 1 for default behavior of xwaf.',
    type: 'number',
    default: os.cpus().length,
    minimum: 1,
    maximum: os.cpus().length * 4,
    order: 1
  }
};

export function provideBuilder() {
  const gccErrorMatch = '(?<file>([A-Za-z]:[\\/])?[^:\\n]+):(?<line>\\d+):(?<col>\\d+):\\s*(fatal error|error):\\s*(?<message>.+)';
  const ocamlErrorMatch = '(?<file>[\\/0-9a-zA-Z\\._\\-]+)", line (?<line>\\d+), characters (?<col>\\d+)-(?<col_end>\\d+):\\n(?<message>.+)';
  const errorMatch = [
    gccErrorMatch, ocamlErrorMatch
  ];

  const gccWarningMatch = '(?<file>([A-Za-z]:[\\/])?[^:\\n]+):(?<line>\\d+):(?<col>\\d+):\\s*(warning):\\s*(?<message>.+)';
  const warningMatch = [
    gccWarningMatch
  ];

  return class XWafBuildProvider extends EventEmitter {
    constructor(cwd) {
      super();
      this.cwd = cwd;
      this.files = Finder.from(cwd).find('wscript');
      atom.config.observe('atom-build-xwaf.jobs', () => this.emit('refresh'));
    }

    getNiceName() {
      return 'XWAF';
    }

    isEligible() {
      return this.files.length > 0;
    }

    settings() {
      const jobs = atom.config.get("atom-build-xwaf.jobs");
      const args = [ `-j${jobs}` ];

      return this.files.map(
        function(file) {
          const names = file.split("/");
          const index = names.length - 2;
          return [
            {
              exec: 'xwaf',
              name: 'XWaf: default : ' + names[index],
              args: [file].concat(args),
              sh: false,
              errorMatch: errorMatch,
              warningMatch: warningMatch
            },
            {
              exec: 'xwaf',
              name: 'XWaf: configure : ' + names[index],
              args: [file, 'configure'],
              sh: false,
              errorMatch: errorMatch,
              warningMatch: warningMatch
            },
            {
              exec: 'xwaf',
              name: 'XWaf: clean : ' + names[index],
              args: [file, 'clean'],
              sh: false,
              errorMatch: errorMatch,
              warningMatch: warningMatch
            }
          ];
        }
      ).reduce(
        function(prev, curr) {
          return prev.concat(curr);
        }
      );
    }
  };
}
