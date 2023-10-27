import assert from 'node:assert/strict';
import { axiosInstance } from '../axios-instance';

export async function credExchSelfSignedCredTutorial(options: {
  presentationDefinition: {
    exchangeId: string;
  };
  vcBaseUrl: string;
  idcBaseUrl: string;
}) {
  const { presentationDefinition, vcBaseUrl, idcBaseUrl } = options;

  console.log('generating a DID - START');

  const did = await axiosInstance
    .post(`${vcBaseUrl}/did`, {
      method: 'key',
    })
    .then(({ status, data }) => {
      assert.equal(status, 201);
      return {
        id: data.id,
        verificationMethod: data.verificationMethod[0].id,
      };
    });

  console.log('configuring exchange');

  await axiosInstance
    .post(`${vcBaseUrl}/vc-api/exchanges`, presentationDefinition)
    .then(({ status }) => {
      assert.equal(status, 201);
    });

  console.log('initiating the issuance exchange');

  const { challenge, serviceEndpoint, inputDescriptor } = await axiosInstance
    .post(`${vcBaseUrl}/vc-api/exchanges/${presentationDefinition.exchangeId}`)
    .then(({ status, data }) => {
      assert.equal(status, 201);

      return {
        challenge: data.vpRequest.challenge,
        serviceEndpoint: data.vpRequest.interact.service[0].serviceEndpoint,
        inputDescriptor:
          data.vpRequest.query[0].credentialQuery[0].presentationDefinition
            .input_descriptors[0],
      };
    });

  const credentialsSubject = inputDescriptor.constraints.fields.find(
    (field: { path: unknown[] }) => field.path.includes('$.credentialSubject'),
  );

  if (credentialsSubject) {
    credentialsSubject.filter.additionalProperties = false;
  }

  const credential = await axiosInstance
    .post(
      `${idcBaseUrl}/converter/input-descriptor-to-credential`,
      inputDescriptor,
    )
    .then(({ status, data }) => {
      assert.equal(status, 201);
      return data.credential;
    });

  credential.issuanceDate = new Date().toISOString();
  credential.issuer = did.id;
  credential.credentialSubject.id = did.id;

  console.log('issuing a self-signed credential');

  const selfSignedCredential = await axiosInstance
    .post(`${vcBaseUrl}/vc-api/credentials/issue`, {
      credential,
      options: {},
    })
    .then(({ status, data }) => {
      assert.equal(status, 201);
      return data;
    });

  console.log('creating a presentation with the self-signed credential');

  const presentation = await axiosInstance
    .post(`${vcBaseUrl}/vc-api/presentations/prove`, {
      presentation: {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://www.w3.org/2018/credentials/examples/v1',
        ],
        type: ['VerifiablePresentation'],
        verifiableCredential: [selfSignedCredential],
        holder: did.id,
      },
      options: {
        verificationMethod: did.verificationMethod,
        proofPurpose: 'authentication',
        challenge,
      },
    })
    .then(({ status, data }) => {
      assert.equal(status, 201);
      return data;
    });

  // console.log(JSON.stringify(presentation, null, 2));

  console.log('continuing exchange');

  await axiosInstance
    .put(serviceEndpoint, presentation)
    .then(({ status, data }) => {
      console.log(data);
      assert.equal(status, 200);
    });
}
