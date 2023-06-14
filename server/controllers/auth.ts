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
  dn: string;
  displayName: string;
  samAccountName: string;
}

const config: Config = { 
    url: 'ldap://dir.ucb-group.com',
    baseDN: 'dc=dir,dc=ucb-group,dc=com',
    username: 'CN=G804083,OU=Users,OU=BRA,OU=BEL,OU=EUR,DC=dir,DC=ucb-group,DC=com',
    password: 'Bonjour@2021'
};

const groupName = 'BRA - Neuroscience';

async function findUser(samAccountName: string): Promise<User | null> {
  const client = new Client({
    url: config.url,
  });

  await client.bind(config.username, config.password);

  const { searchEntries } = await client.search(config.baseDN, {
    scope: 'sub',
    filter: `(samAccountName=${samAccountName})`,
  });

  await client.unbind();

  return searchEntries[0] 
    ? { 
      dn: searchEntries[0].dn, 
      displayName: Array.isArray(searchEntries[0].displayName) 
        ? (searchEntries[0].displayName[0] as string) // explicit type cast to string
        : (searchEntries[0].displayName as string),   // explicit type cast to string
      samAccountName 
    } 
    : null;
}

async function authenticate(userDN: string, password: string): Promise<boolean> {
  const client = new Client({
    url: config.url,
  });

  try {
    await client.bind(userDN, password);
    await client.unbind();
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export async function getUserAcc(req: Request, res: Response): Promise<void> {
  const samAccountName = req.body.CorporateAccount;

  const user = await findUser(samAccountName);

  if (!user) {
    console.log(`User: ${samAccountName} not found.`);
    res.status(404).send(`User: ${samAccountName} not found.`);
  } else {
    console.log(user);
    res.send(user.displayName);
  }
}

export async function setUserAuth(req: Request, res: Response): Promise<void> {
  const samAccountName = req.body.CorporateAccount;
  const password = req.body.Password;

  const user = await findUser(samAccountName);

  if (!user) {
    console.log(`User: ${samAccountName} not found.`);
    req.session.destroy(() => {}); // provide an empty function as a callback
    res.status(401).send({ error: `User: ${samAccountName} not found!` });
  } else {
    if (await authenticate(user.dn, password)) {
      req.session.CorporateAccount = samAccountName;
      res.send({ displayName: user.displayName });
    } else {
      req.session.destroy(() => {}); // provide an empty function as a callback
      res.status(401).send({ error: "Incorrect corporate account/password combination!" });
    }
  }
}
