import { randomUUID } from 'node:crypto';
import { IDC_BASE_URL, VC_BASE_URL } from './const';
import { credExchSelfSignedCredTutorial } from './lib';
import { presentationDefinitionTutorial } from './presentation-definitions';

const presentationDefinition = {
  // ...presentationDefinitionCarOwnership,
  ...presentationDefinitionTutorial,
  exchangeId: randomUUID(),
};

credExchSelfSignedCredTutorial({
  presentationDefinition,
  vcBaseUrl: VC_BASE_URL,
  idcBaseUrl: IDC_BASE_URL,
});
