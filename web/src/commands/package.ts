import { CommandContext } from '../core/CommandProcessor';

async function aptCommand(args: string[], ctx: CommandContext): Promise<void> {
  const sub = args[0];

  if (!sub) {
    ctx.output('apt 2.7.14 (arm64)');
    ctx.output('Usage: apt [options] command');
    ctx.output('');
    ctx.output('Commands:');
    ctx.output('  update     - Update list of available packages');
    ctx.output('  upgrade    - Upgrade the system by upgrading all packages');
    ctx.output('  install    - Install packages');
    ctx.output('  remove     - Remove packages');
    ctx.output('  purge      - Remove packages and configuration files');
    ctx.output('  search     - Search in package descriptions');
    ctx.output('  show       - Show package details');
    ctx.output('  list       - List packages with criteria');
    return;
  }

  switch (sub) {
    case 'update': {
      await ctx.pm.update(text => ctx.output(text));
      break;
    }

    case 'upgrade': {
      await ctx.pm.upgrade(text => ctx.output(text));
      break;
    }

    case 'install': {
      const names = args.slice(1).filter(a => !a.startsWith('-'));
      if (names.length === 0) { ctx.output('apt install: package name required', 'error'); break; }
      const yes = args.includes('-y') || args.includes('--yes');
      if (!yes) {
        ctx.output('Reading package lists... Done');
        ctx.output('Building dependency tree... Done');
        ctx.output('');
        await ctx.pm.install(names, text => ctx.output(text));
      } else {
        await ctx.pm.install(names, text => ctx.output(text));
      }
      break;
    }

    case 'remove':
    case 'purge': {
      const names = args.slice(1).filter(a => !a.startsWith('-'));
      if (names.length === 0) { ctx.output(`apt ${sub}: package name required`, 'error'); break; }
      await ctx.pm.remove(names, text => ctx.output(text));
      break;
    }

    case 'search': {
      const query = args.slice(1).join(' ');
      if (!query) { ctx.output('apt search: query required', 'error'); break; }
      ctx.output('Sorting... Done');
      ctx.output('Full Text Search... Done');
      const results = ctx.pm.search(query);
      if (results.length === 0) { ctx.output(`No packages found for '${query}'`); break; }
      for (const pkg of results) {
        const status = pkg.installed ? '\x1b[32m[installed]\x1b[0m' : '';
        ctx.output(`${pkg.name}/${pkg.installed ? 'now' : 'stable'} ${pkg.version} arm64 ${status}`);
        ctx.output(`  ${pkg.description}`);
        ctx.output('');
      }
      break;
    }

    case 'show': {
      const name = args[1];
      if (!name) { ctx.output('apt show: package name required', 'error'); break; }
      const info = ctx.pm.showInfo(name);
      if (!info) { ctx.output(`E: No packages found`, 'error'); break; }
      for (const line of info.split('\n')) ctx.output(line);
      break;
    }

    case 'list': {
      const installed = args.includes('--installed');
      const upgradable = args.includes('--upgradable');
      const all = args.includes('--all-versions');

      ctx.output('Listing...');
      const pkgs = installed ? ctx.pm.getInstalled() : ctx.pm.listAll();
      for (const pkg of pkgs) {
        const status = pkg.installed ? '[installed]' : '';
        ctx.output(`${pkg.name}/stable ${pkg.version} arm64 ${status}`);
      }
      break;
    }

    case 'autoremove': {
      ctx.output('Reading package lists... Done');
      ctx.output('Building dependency tree... Done');
      ctx.output('0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.');
      break;
    }

    case 'clean':
    case 'autoclean': {
      ctx.output('Clearing package cache...');
      await new Promise(r => setTimeout(r, 300));
      ctx.output('Done.');
      break;
    }

    default: {
      ctx.output(`E: Invalid operation ${sub}`, 'error');
    }
  }
}

export const packageCommands: Record<string, (cmd: string, args: string[], ctx: CommandContext) => Promise<void>> = {
  async apt(cmd, args, ctx) {
    await aptCommand(args, ctx);
  },

  async aptget(cmd, args, ctx) {
    await aptCommand(args, ctx);
  },

  async pkg(cmd, args, ctx) {
    const sub = args[0];

    if (!sub) {
      ctx.output('Usage: pkg command [arguments]');
      ctx.output('');
      ctx.output('install      Install package(s).');
      ctx.output('uninstall    Uninstall package(s).');
      ctx.output('reinstall    Reinstall package(s).');
      ctx.output('update       Update list of available packages.');
      ctx.output('upgrade      Upgrade installed packages.');
      ctx.output('search       Search for package(s).');
      ctx.output('show         Show information about package(s).');
      ctx.output('list-all     List all available packages.');
      ctx.output('list-installed  List installed packages.');
      return;
    }

    switch (sub) {
      case 'install':
        await aptCommand(['install', ...args.slice(1)], ctx);
        break;
      case 'uninstall':
      case 'remove':
        await aptCommand(['remove', ...args.slice(1)], ctx);
        break;
      case 'update':
        await aptCommand(['update'], ctx);
        break;
      case 'upgrade':
        await aptCommand(['upgrade'], ctx);
        break;
      case 'search':
        await aptCommand(['search', ...args.slice(1)], ctx);
        break;
      case 'show':
        await aptCommand(['show', args[1]], ctx);
        break;
      case 'list-all':
        await aptCommand(['list'], ctx);
        break;
      case 'list-installed':
        await aptCommand(['list', '--installed'], ctx);
        break;
      case 'reinstall': {
        const names = args.slice(1).filter(a => !a.startsWith('-'));
        await ctx.pm.remove(names, t => ctx.output(t));
        await ctx.pm.install(names, t => ctx.output(t));
        break;
      }
      default:
        ctx.output(`pkg: unknown command: ${sub}`, 'error');
    }
  },

  async dpkg(cmd, args, ctx) {
    const list = args.includes('-l') || args.includes('--list');
    const query = args.includes('-S');
    const status = args.includes('-s') || args.includes('--status');
    const name = args.find(a => !a.startsWith('-'));

    if (list) {
      ctx.output('Desired=Unknown/Install/Remove/Purge/Hold');
      ctx.output('| Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst/trig-aWait/Trig-pend');
      ctx.output('|/ Err?=(none)/Reinst-required (Status,Err: uppercase=bad)');
      ctx.output('||/ Name                Version              Architecture Description');
      ctx.output('+++-==================-====================-============-=================================');
      for (const pkg of ctx.pm.getInstalled()) {
        ctx.output(`ii  ${pkg.name.padEnd(20)} ${pkg.version.padEnd(20)} arm64        ${pkg.description.slice(0, 40)}`);
      }
    } else if (status && name) {
      const info = ctx.pm.showInfo(name);
      if (!info) {
        ctx.output(`dpkg-query: package '${name}' is not installed and no information is available`, 'error');
      } else {
        for (const line of info.split('\n')) ctx.output(line);
      }
    } else {
      ctx.output('Usage: dpkg [<option> ...] <command>');
    }
  },

  async pip(cmd, args, ctx) {
    if (!ctx.pm.isInstalled('python') && !ctx.pm.isInstalled('python2')) {
      ctx.output('pip: command not found\nInstall with: apt install python', 'error');
      return;
    }
    const sub = args[0];
    if (sub === 'install') {
      const pkg = args[1];
      if (!pkg) { ctx.output('pip install: package required', 'error'); return; }
      ctx.output(`Collecting ${pkg}`);
      ctx.output(`  Downloading ${pkg}-1.0.0-py3-none-any.whl (45 kB)`);
      await new Promise(r => setTimeout(r, 500));
      ctx.output(`Installing collected packages: ${pkg}`);
      ctx.output(`Successfully installed ${pkg}-1.0.0`, 'success');
    } else if (sub === 'list') {
      ctx.output('Package         Version');
      ctx.output('--------------- -------');
      ctx.output('pip             23.3.2');
      ctx.output('setuptools      69.0.3');
      ctx.output('wheel           0.42.0');
    } else {
      ctx.output(`pip ${args.join(' ')}: command processed`);
    }
  },

  async pip3(cmd, args, ctx) {
    await packageCommands.pip(cmd, args, ctx);
  },

  async npm(cmd, args, ctx) {
    if (!ctx.pm.isInstalled('nodejs')) {
      ctx.output('npm: command not found\nInstall with: apt install nodejs', 'error');
      return;
    }
    ctx.output(`npm ${args.join(' ')}: processed`);
  },

  async gem(cmd, args, ctx) {
    if (!ctx.pm.isInstalled('ruby')) {
      ctx.output('gem: command not found\nInstall with: apt install ruby', 'error');
      return;
    }
    ctx.output(`gem ${args.join(' ')}: processed`);
  },
};
