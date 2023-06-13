import { Client } from 'ldapts';
import { Request, Response } from 'express';
import session from 'express-session';

interface Config {
  url: string;
  baseDN: string;
  username: string;
  password: string;
}

interface User {
  displayName: string;
  dn: string;
}

const config: Config = { 
    url: 'ldap://dir.ucb-group.com',
    baseDN: 'dc=dir,dc=ucb-group,dc=com',
    username: 'CN=G804083,OU=Users,OU=BRA,OU=BEL,OU=EUR,DC=dir,DC=ucb-group,DC=com',
    password: 'Bonjour@2021'
};

const groupName = 'BRA - Neuroscience';

async function findUser(sAMAccountName: string): Promise<User | null> {
  const client = new Client({
    url: config.url,
  });

  await client.bind(config.username, config.password);

  const { searchEntries } = await client.search(config.baseDN, {
    scope: 'sub',
    filter: `(sAMAccountName=${sAMAccountName})`,
  });

  await client.unbind();

  return searchEntries[0] || null;
}

async function authenticate(userDn: string, password: string): Promise<boolean> {
  const client = new Client({
    url: config.url,
  });

  try {
    await client.bind(userDn, password);
    await client.unbind();
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export async function getUserAcc(req: Request, res: Response): Promise<void> {
  const sAMAccountName = req.body.firstName;

  const user = await findUser(sAMAccountName);

  if (!user) {
    console.log(`User: ${sAMAccountName} not found.`);
    res.status(404).send(`User: ${sAMAccountName} not found.`);
  } else {
    console.log(user);
    res.send(user.displayName);
  }
}

export async function setUserAuth(req: Request, res: Response): Promise<void> {
  const sAMAccountName = req.body.Corporate_Account;
  const password = req.body.Password;

  const user = await findUser(sAMAccountName);

  if (!user) {
    console.log(`User: ${sAMAccountName} not found.`);
    req.session.destroy();
    res.status(401).send({ error: `User: ${sAMAccountName} not found!` });
  } else {
    if (await authenticate(user.dn, password)) {
      req.session.CorporateAccount = sAMAccountName;
      res.send({ displayName: user.displayName });
    } else {
      req.session.destroy();
      res.status(401).send({ error: "Incorrect Corporate Account/Password combination!" });
    }
  }
}
