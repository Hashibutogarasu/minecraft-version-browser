import { IRefreshable } from '../../interfaces/irefreshable';

export function refreshAllCommand(...args: IRefreshable[]) {
  args.forEach((arg) => {
    arg.refresh();
  });
}