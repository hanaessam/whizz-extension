import Document from './Document';
import axios from 'axios';
import { baseUri } from '../constants';
import { getUserId } from '../vscode-gateway/user';

abstract class DocumentGenerator {
  constructor() { }

  async generateContent(projectPath: any, fields: any, format: any, projectSummary: any) {
    try {
      const content = await axios.post(`${baseUri}/vscode/generate-documentation`, {
        documentationDetails: {
          projectPath: projectPath,
          fields: fields,
          format: format,
          projectSummary: projectSummary
        }, userId: getUserId()
      });


      return content.data;
    } catch (error: any) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
      console.error('Error config:', error.config);

      // Rethrow the error to propagate it upwards
      throw new Error('Failed to generate documentation');
    }
  }


  abstract generate(document: any, filePath: any): Promise<void>;


}



export default DocumentGenerator;
