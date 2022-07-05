import jwt_decode from "jwt-decode";
import _ from "lodash";

import { SaveNotificationsByBatchRequestDto } from "../dtos/requests/save-notifcations-by-batch";
import { GetNotificationsResponseModel } from "../models/get-notifications-response";

export class Helpers {
    public static convertJsonToArrayGroupByBatchId(collection: any) {
        const groupByParam = _.mapValues(_.groupBy(collection, "batch_id"), (batchIdList) =>
            batchIdList.map((batchId) => _.omit(batchId, "batch_id"))
        );
        const keys = Object.keys(groupByParam);
        const response: any = [];
        keys.forEach((key) => {
            response.push({
                batch_id: key,
                result: groupByParam[key]
            });
        });
        return response;
    }

    public static checkClientIdsForDuplicates(client_ids: string[]) {
        return _.uniq(client_ids).length !== client_ids.length;
    }

    public static generateTimeNowInCustomFormat(): string {
        const nowDate: Date = this.addHours(8); // server side time
        const splitDate = nowDate.toISOString().split("T")[0].split("-");
        const updated_at: string = `${`${splitDate[0]}-${splitDate[1]}-${nowDate.getDate()}`} ${nowDate.toTimeString().split(" ")[0]}`;
        return updated_at;
    }

    public static addHours(numOfHours: number, date = new Date()) {
        date.setTime(date.getTime() + numOfHours * 60 * 60 * 1000);
        return date;
    }

    public static decodeUserIdFromAccesToken(accesToken: string): string {
        const decodedToken: any = jwt_decode(accesToken.split(" ")[1]);
        return decodedToken.user_id;
    }

    public static filterNotifIdAndClientId(sourceTableItems: any[], id: string | null, client_id: string | null) {
        return _.filter(sourceTableItems, (item: any) => {
            if (id && client_id) {
                return id == item.id && client_id == item.client_id;
            } else if (id && !client_id) {
                return id == item.id;
            } else if (!id && client_id) {
                return client_id == item.client_id;
            }
        }).map(
            (item: any) =>
                new GetNotificationsResponseModel(
                    item.id,
                    item.client_id,
                    item.data,
                    item.created_by,
                    item.created_at,
                    item.read,
                    item.batch_id
                )
        );
    }

    public static filterNonDeletedNotifs(sourceTableItems: []) {
        return sourceTableItems
            .filter((item: any) => !item.deleted_at || item.deleted_at == "")
            .map(
                (item: any) =>
                    new GetNotificationsResponseModel(
                        item.id,
                        item.client_id,
                        item.data,
                        item.created_by,
                        item.created_at,
                        item.read,
                        item.batch_id
                    )
            );
    }
    public static filterIsBatchAndBatchId(sourceTableItems: [], isBatch: boolean, batch_id: string | null) {
        return isBatch
            ? sourceTableItems.filter((item: any) => {
                  if (item.batch_id) {
                      if (!batch_id)
                          return new GetNotificationsResponseModel(
                              item.id,
                              item.client_id,
                              item.data,
                              item.created_by,
                              item.created_at,
                              item.read,
                              item.batch_id
                          );
                      else if (batch_id == item.batch_id)
                          return new GetNotificationsResponseModel(
                              item.id,
                              item.client_id,
                              item.data,
                              item.created_by,
                              item.created_at,
                              item.read,
                              item.batch_id
                          );
                  }
              })
            : sourceTableItems.filter((item: any) => {
                  return new GetNotificationsResponseModel(
                      item.id,
                      item.client_id,
                      item.data,
                      item.created_by,
                      item.created_at,
                      item.read,
                      item.batch_id
                  );
              });
    }

    public static generateRequestItems(params: SaveNotificationsByBatchRequestDto[], tableName: string) {
        const putRequests: any = params.map((param) => {
            return {
                PutRequest: {
                    Item: param
                }
            };
        });
        return {
            RequestItems: {
                [tableName]: putRequests
            }
        };
    }

    public static removeDuplicateOrNullInArray(client_ids: string[]) {
        const client_ids_container: string[] = [];
        client_ids.forEach((client_id: string) => {
            if (client_id != "") {
                if (!client_ids_container.includes(client_id)) client_ids_container.push(client_id);
            }
        });
        return client_ids_container;
    }
}
