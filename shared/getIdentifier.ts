import helpers from "./helpers";
import path from 'path';
import fs from 'fs-extra';
import { nanoid } from 'nanoid';

let identifier: string;

export function getIdentifier(): [string, boolean] {
  let isNew = false;
  if (!identifier) {
    const liveProfilePath = helpers.getLiveDirectoryPathResources();
    const identifierPath = path.join(liveProfilePath, 'identifier');
    if (!fs.existsSync(liveProfilePath)) {
      fs.mkdirpSync(liveProfilePath)
    }
    if (!fs.existsSync(identifierPath)) {
      identifier = nanoid();
      isNew = true;
      fs.writeFileSync(identifierPath, identifier);
    } else {
      identifier = fs.readFileSync(identifierPath, 'utf8');
    }
  }
  return [identifier, isNew];
}


