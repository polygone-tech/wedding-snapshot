import {
  PutObjectCommand,
  ListObjectsCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';


const s3Client = new S3Client({
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

/**
 * Convert base64 data URL to Blob (Web only)
 */

const getPresignedUploadUrl = async (fileName: string, contentType: string): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: "weddingsnapshot",
    Key: fileName,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
  return signedUrl;
}

const dataUrlToBlob = (dataUrl: string): Blob =>{
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Uploads an image (either from a URI on native or data URL on web) to S3.
 */
export async function uploadImageToS3(
  imageSource: string, // localUri (native) or dataUrl (web)
  fileName: string
): Promise<string> {
  let blob: Blob;
  let contentType: string;

  if (Platform.OS === 'web') {
    blob = dataUrlToBlob(imageSource);
    contentType = blob.type;
  } else {
    const response = await fetch(imageSource);
    blob = await response.blob();
    contentType = blob.type || 'image/jpeg';
  }

  const presignedUrl = await getPresignedUploadUrl(fileName, contentType);

  const uploadRes = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: blob,
  });

  if (!uploadRes.ok) throw new Error('S3 upload failed');

  return presignedUrl.split('?')[0]; // public S3 URL
}

export const listObjectsFromS3 = async () => {
  const command = new ListObjectsCommand({ Bucket: "weddingsnapshot" });
  console.log(command);
  s3Client.send(command).then(({ Contents }) => Contents || [])
}