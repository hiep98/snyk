import * as needle from 'needle';
import * as fs from 'fs';
import * as debugLib from 'debug';
import * as isExe from 'isexe';
import * as cacheDir from 'cachedir';
import * as child_process from 'child_process';
import * as os from 'os';

const debug = debugLib('drift');
export const driftctlVersion = 'v0.19.0';
const dctlBaseUrl = 'https://github.com/snyk/driftctl/releases/download/';
const cache = cacheDir('snyk');
const driftctlPath = cache + '/driftctl_' + driftctlVersion;

interface DriftCTLOptions {
  quiet?: true;
  filter?: string;
  output?: string;
  to?: string;
  headers?: string;
  'tfc-token'?: string;
  'tfc-endpoint'?: string;
  'tf-provider-version'?: string;
  strict?: true;
  deep?: true;
  driftignore?: string;
  'tf-lockfile'?: string;
  'config-dir'?: string;
  from?: string; // TODO We only handle one from at a time due to snyk cli arg parsing
}

export function parseArgs(
  commands: string[],
  options: DriftCTLOptions,
): string[] {
  const args: string[] = commands;

  if (options.quiet) {
    args.push('--quiet');
  }

  if (options.filter) {
    args.push('--filter');
    args.push(options.filter);
  }

  if (options.output) {
    args.push('--output');
    args.push(options.output);
  }

  if (options.headers) {
    args.push('--headers');
    args.push(options.headers);
  }

  if (options['tfc-token']) {
    args.push('--tfc-token');
    args.push(options['tfc-token']);
  }

  if (options['tfc-endpoint']) {
    args.push('--tfc-endpoint');
    args.push(options['tfc-endpoint']);
  }

  if (options['tf-provider-version']) {
    args.push('--tf-provider-version');
    args.push(options['tf-provider-version']);
  }

  if (options.strict) {
    args.push('--strict');
  }

  if (options.deep) {
    args.push('--deep');
  }

  if (options.driftignore) {
    args.push('--driftignore');
    args.push(options.driftignore);
  }

  if (options['tf-lockfile']) {
    args.push('--tf-lockfile');
    args.push(options['tf-lockfile']);
  }

  let configDir = cache;
  if (options['config-dir']) {
    configDir = options['config-dir'];
  }
  args.push('--config-dir');
  args.push(configDir);

  if (options.from) {
    args.push('--from');
    args.push(options.from);
  }

  let to = 'aws+tf';
  if (options.to) {
    to = options.to;
  }
  args.push('--to');
  args.push(to);

  debug(args);

  return args;
}

export async function driftctl(args: string[]): Promise<number> {
  debug('running driftctl %s ', args.join(' '));

  const path = await findOrDownload();

  return await launch(path, args);
}

async function launch(path: string, args: string[]): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const child = child_process.spawn(path, args, { stdio: 'inherit' });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('exit', (code) => {
      if (code) {
        resolve(code);
      } else {
        resolve(-1);
      }
    });
  });
}

async function findOrDownload(): Promise<string> {
  let dctl = await findDriftCtl();
  if (dctl === '') {
    try {
      if (!fs.existsSync(cache)) {
        fs.mkdirSync(cache, { recursive: true });
      }
      dctl = driftctlPath;
      await download(driftctlUrl(), dctl);
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return dctl;
}

export async function findDriftCtl(): Promise<string> {
  // lookup in custom path contained in env var DRIFTCTL_PATH
  let dctlPath: string | null | undefined = process.env.DRIFTCTL_PATH;
  if (dctlPath != undefined) {
    const exists = isExe.sync(dctlPath, { ignoreErrors: true });
    if (exists) {
      debug('Found driftctl in $DRIFTCTL_PATH: %s', dctlPath);
      return dctlPath;
    }
  }

  // lookup in app cache
  dctlPath = driftctlPath;
  const exists = isExe.sync(dctlPath, { ignoreErrors: true });
  if (exists) {
    debug('Found driftctl in cache: %s', dctlPath);
    return dctlPath;
  }
  debug('driftctl not found');

  return '';
}

async function download(url, destination: string): Promise<boolean> {
  debug('downloading driftctl into %s', destination);

  return new Promise<boolean>((resolve, reject) => {
    needle.get(url, { output: destination, follow: 3 }, function(
      err,
      response,
    ) {
      debug('File saved: ' + destination);
      if (err) {
        reject(err);
        return;
      }
      if (response.statusCode !== 200) {
        // badness
        reject(response.statusCode);
        return;
      }
      fs.chmodSync(destination, 744);
      resolve(true);
    });
  });
}

function driftctlUrl(): string {
  let platform = 'linux';
  switch (os.platform()) {
    case 'darwin':
      platform = 'darwin';
      break;
    case 'win32':
      platform = 'windows';
      break;
  }

  let arch = 'amd64';
  switch (os.arch()) {
    case 'ia32':
    case 'x32':
      arch = '386';
      break;
    case 'arm':
      arch = 'arm';
      break;
    case 'arm64':
      arch = 'arm64';
      break;
  }

  let ext = '';
  switch (os.platform()) {
    case 'win32':
      ext = '.exe';
      break;
  }

  return `${dctlBaseUrl}/${driftctlVersion}/driftctl_${platform}_${arch}${ext}`;
}
