import {
  PutObjectCommand,
  ListObjectsCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";


const client = new S3Client({
  // The AWS Region where the Amazon Simple Storage Service (Amazon S3) bucket will be created. Replace this with your Region.
  region: "us-east-1",
  credentials: fromCognitoIdentityPool({
    // Replace the value of 'identityPoolId' with the ID of an Amazon Cognito identity pool in your Amazon Cognito Region.
    identityPoolId: "us-east-1:de85a9f3-8d3e-485e-b2bb-6b6109fcd91e",
    // Replace the value of 'region' with your Amazon Cognito Region.
    clientConfig: { region: "us-east-1" },
  }),
});

/**
 * Uploads a file to an S3 bucket.
 *
 * @param {Object} params - The parameters for the upload.
 * @param {string} params.filePath - The local path to the file to upload.
 * 
 * 
 */
export const uploadFiletoS3 = async ({
  filePath,
}: { filePath: string }) => {
  const fileStream = await fetch(filePath).then((response) => response.body);
  
  const command = new PutObjectCommand({
    Bucket: "weddingsnapshot",
    Key: Date.now() + "-" + "test",
    Body: fileStream || undefined,
  });

  try {
    const response = await client.send(command);
    console.log(response);
  } catch (caught) {
    if (
      caught instanceof S3ServiceException &&
      caught.name === "EntityTooLarge"
    ) {
      console.error(
        `Error from S3 while uploading object to bucket. \
The object was too large. To upload objects larger than 5GB, use the S3 console (160GB max) \
or the multipart upload API (5TB max).`,
      );
    } else if (caught instanceof S3ServiceException) {
      console.error(
        `Error from S3 while uploading object to bucket.  ${caught.name}: ${caught.message}`,
      );
    } else {
      throw caught;
    }
  }
};

export const listObjectsFromS3 = async () => {
  const command = new ListObjectsCommand({ Bucket: "weddingsnapshot" });
  console.log(command);
  client.send(command).then(({ Contents }) => Contents || [])
}