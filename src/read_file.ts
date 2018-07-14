import * as fs from 'fs';
import * as path from 'path';
interface IReadOpt {
    mini: boolean;
}
export function rHtml (dir: string, opt: IReadOpt): string{
    let htmlStr = '';
    let absoluteDir = path.resolve(__dirname, dir);
    if(fs.existsSync(absoluteDir)) {
        htmlStr =  fs.readFileSync(absoluteDir, 'utf-8');
    } else {
        console.log(absoluteDir, 'is not exit');
    }
    if (opt.mini) {
        htmlStr = htmlStr.replace(/[\r\t\n\s]+/, ' ');
    }
    return htmlStr;
}
