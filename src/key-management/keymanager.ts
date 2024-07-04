import axios from "axios";
import { baseUri } from "../constants";

export class KeyManager {
  static async getKey(user_id : string | undefined) {
    if(!user_id) throw new Error("User id is required");
    const key = await axios.get(`${baseUri}/key/${user_id}`);
    return key.data.key;
  }
  static async addKey(user_id : string | undefined, key : string) {
    if(!user_id) throw new Error("User id is required");
    const response = await axios.post(`${baseUri}/key/${user_id}`, {key});
    return response.data;
  }
  static async removeKey(user_id : string | undefined) {
    if(!user_id) throw new Error("User id is required");
    const response = await axios.delete(`${baseUri}/key/${user_id}`);
    return response.data;
  }
}