import _ from "lodash";
import moment from "moment";

import { DYNAMODB, FORMATS, MONTHS } from "../constants/CONSTANTS.json";
import locations from "../constants/locations.json";

export class Helpers {
    public static getTotalNumberOfLocations(table: any, locations: any, groupByParam: any): any {
        const locationsArr = Object.values(locations);
        table.Items.forEach((item: any) => {
            if (item[groupByParam] != undefined) {
                let isFound = 0;
                locationsArr.forEach((city: any) => {
                    if (item[groupByParam].toLowerCase().replace("ñ", "n").includes(city.replace("ñ", "n"))) {
                        isFound = 1;
                        item[groupByParam] = city.replace(" ", "_").replace("ñ", "n");
                    } else {
                        const withoutCity = city.replace(" city", "");
                        if (
                            item[groupByParam].toLowerCase().replace("ñ", "n").includes(withoutCity.replace("ñ", "n"))
                        ) {
                            isFound = 1;
                            item[groupByParam] = city.replace(" ", "_").replace("ñ", "n");
                        }
                    }
                });
                if (isFound == 0) item[groupByParam] = "others";
            } else {
                item[groupByParam] = null;
            }
        });
        const grouppedByParam: any = _.groupBy(table.Items, groupByParam);
        const paramKeys = Object.keys(grouppedByParam);
        paramKeys.forEach((paramKey: any) => {
            grouppedByParam[paramKey] = grouppedByParam[paramKey].length;
        });
        return grouppedByParam;
    }

    public static generateTimeNowInCustomFormat(): string {
        const nowDate: Date = new Date();
        const splitDate = nowDate.toISOString().split("T")[0].split("-");
        const updated_at: string = `${`${splitDate[0]}-${splitDate[1]}-${nowDate.getDate()}`} ${
            nowDate.toTimeString().split(" ")[0]
        }`;
        return updated_at;
    }

    public static generateRequestItemsForBatchWrite(targetTableName: string, items: any) {
        return {
            RequestItems: {
                [targetTableName]: items.map((result: any) => {
                    return {
                        PutRequest: {
                            Item: {
                                ticketCreatedAt: result.ticketCreatedAt,
                                total: result.total,
                                completed: result.completed,
                                cancelled: result.cancelled,
                                pending: result.pending,
                                in_progress: result.in_progress,
                                delayed: result.delayed,
                                serviceTypeDispatchDates: result.serviceTypeDispatchDates,
                                categoryDispatchDates: result.byDeliveryDateCategoryResults,
                                peersAssigned: result.peersAssigned,
                                locations: result.locations,
                                created_at: this.generateTimeNowInCustomFormat(),
                                updated_at: this.generateTimeNowInCustomFormat()
                            }
                        }
                    };
                })
            }
        };
    }

    public static differenceWithParams(sourceArr: any, destinationArr: any) {
        let sourceRes: any = [],
            destinationRes: any = [];
        sourceRes = this.sortDataFromSourceTable(sourceArr);
        destinationRes = destinationArr.map((item: any) => {
            return {
                ticketCreatedAt: item.ticketCreatedAt,
                total: item.total,
                completed: item.completed,
                cancelled: item.cancelled,
                pending: item.pending,
                in_progress: item.in_progress,
                delayed: item.delayed,
                serviceTypeDispatchDates: item.serviceTypeDispatchDates,
                categoryDispatchDates: item.categoryDispatchDates,
                peersAssigned: item.peersAssigned,
                locations: item.locations
            };
        });
        return [sourceRes, destinationRes];
    }

    public static determineUpdateItems(destinationArr: any, difference: any) {
        let count = 0;
        const updateItems = [];
        for (const item of destinationArr) {
            for (const item2 of difference) {
                if (item.ticketCreatedAt == item2.ticketCreatedAt) updateItems.push(difference.splice(count, 1)[0]);
                count++;
            }
            count = 0;
        }
        return updateItems;
    }

    public static sortOutTicketsPerDestinations(groupByDeliveryDates: any, sortKey: string) {
        const locationsArr = Object.values(locations);
        groupByDeliveryDates.forEach((item: any) => {
            if (item[sortKey] != undefined) {
                let isFound = 0;
                locationsArr.forEach((city: any) => {
                    if (item[sortKey].toLowerCase().replace("ñ", "n").includes(city.replace("ñ", "n"))) {
                        isFound = 1;
                        item[sortKey] = city.replace(" ", "_").replace("ñ", "n");
                    } else {
                        const withoutCity = city.replace(" city", "");
                        if (item[sortKey].toLowerCase().replace("ñ", "n").includes(withoutCity.replace("ñ", "n"))) {
                            isFound = 1;
                            item[sortKey] = city.replace(" ", "_").replace("ñ", "n");
                        }
                    }
                });
                if (isFound == 0) item[sortKey] = "others";
            } else {
                item[sortKey] = null;
            }
        });

        const groupByPickupAddress: any = _.groupBy(groupByDeliveryDates, sortKey);
        const groupByPickupAddressParams = Object.keys(groupByPickupAddress);
        groupByPickupAddressParams.forEach((param: any) => {
            groupByPickupAddress[param] = groupByPickupAddress[param].length;
        });
        return groupByPickupAddress;
    }

    public static getLocations(locationsData: any, destinationLocations: any, originLocations: any) {
        locationsData.forEach((item: any) => {
            const destinationKeys = Object.keys(item.destinations);
            destinationKeys.forEach((destinationKey: string) => {
                if (!destinationLocations.includes(destinationKey)) destinationLocations.push(destinationKey);
            });
            const originKeys = Object.keys(item.origins);
            originKeys.forEach((originKey: string) => {
                if (!originLocations.includes(originKey)) originLocations.push(originKey);
            });
        });
    }
    public static populateLocationsResults(
        locationsData: any,
        destinationLocations: any,
        originLocations: any,
        destinationMaps: any,
        originMaps: any
    ) {
        locationsData.forEach((item: any) => {
            destinationLocations.forEach((location: string) => {
                if (!_.has(destinationMaps, location)) {
                    if (item.destinations[location] != undefined)
                        destinationMaps[location] = item.destinations[location];
                } else {
                    if (item.destinations[location] != undefined)
                        destinationMaps[location] += item.destinations[location];
                }
            });
        });
        locationsData.forEach((item: any) => {
            originLocations.forEach((location: string) => {
                if (!_.has(originMaps, location)) {
                    if (item.origins[location] != undefined) originMaps[location] = item.origins[location];
                } else {
                    if (item.origins[location] != undefined) originMaps[location] += item.origins[location];
                }
            });
        });
    }

    public static decodeNumberToMonth(numMonth: number) {
        let month: string;
        switch (numMonth) {
            case 1:
                month = MONTHS.JAN;
                break;
            case 2:
                month = MONTHS.FEB;
                break;
            case 3:
                month = MONTHS.MAR;
                break;
            case 4:
                month = MONTHS.APR;
                break;
            case 5:
                month = MONTHS.MAY;
                break;
            case 6:
                month = MONTHS.JUN;
                break;
            case 7:
                month = MONTHS.JUL;
                break;
            case 8:
                month = MONTHS.AUG;
                break;
            case 9:
                month = MONTHS.SEP;
                break;
            case 10:
                month = MONTHS.OCT;
                break;
            case 11:
                month = MONTHS.NOV;
                break;
            case 12:
                month = MONTHS.DEC;
                break;
            default:
                month = "";
                break;
        }
        return month;
    }

    private static dateFormatChecker(date: string) {
        if (date.includes("/")) {
            return date;
        } else {
            const splitDate: any = date.match(/\b[\w']+(?:[^\w\n]+[\w']+){0,2}\b/g);
            const dateFormat: any = splitDate ? (splitDate[0] ? new Date(splitDate[0]) : "") : "";
            const validDate = dateFormat != "Invalid Date" ? dateFormat.toLocaleString().split(",")[0] : "";
            return validDate;
        }
    }

    public static sortDataFromSourceTable(tableInput: any): any {
        tableInput.Items.forEach((item: any) => {
            item[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.PEER_ASSIGNED] =
                item[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.PEER_ASSIGNED].toLowerCase();
            item[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.CREATED_AT] = this.dateFormatChecker(
                item[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.CREATED_AT]
            );
            item[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.SERVICE_TYPE] =
                item[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.SERVICE_TYPE].toLowerCase();
            item[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.CATEGORY] =
                item[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.CATEGORY].toLowerCase();
            if (
                !item[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.DELIVERY_DATE] ||
                item[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.DELIVERY_DATE] == ""
            )
                item[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.DELIVERY_DATE] =
                    DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.NOT_YET_DISPATCHED;
        });

        const groupByCreatedAt = _.groupBy(tableInput.Items, DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.CREATED_AT);
        const createdAtKeys = Object.keys(groupByCreatedAt).sort();
        const byCreatedAtResults: any = [];

        createdAtKeys.forEach((createdAtKey: string) => {
            const groupByDeliveryDate = _.groupBy(
                groupByCreatedAt[createdAtKey],
                DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.DELIVERY_DATE
            );
            const deliveryDateKeys = Object.keys(groupByDeliveryDate).sort();
            const groupByStatus = _.groupBy(
                groupByCreatedAt[createdAtKey],
                DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.STATUS
            );
            const statusKeys = Object.keys(groupByStatus);
            const byDeliveryDateServiceTypeResults: any = [];
            const byPeerAssignedResults: any = [];
            const byLocationResults: any = [];
            const byDeliveryDateCategoryResults: any = [];
            deliveryDateKeys.forEach((deliveryDateKey: string) => {
                const groupByServiceType = _.groupBy(
                    groupByDeliveryDate[deliveryDateKey],
                    DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.SERVICE_TYPE
                );
                const serviceTypeKeys = Object.keys(groupByServiceType);
                serviceTypeKeys.forEach((serviceTypeKey: string) => {
                    const groupByStatus = _.groupBy(
                        groupByServiceType[serviceTypeKey],
                        DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.STATUS
                    );
                    const statusKeys = Object.keys(groupByStatus);
                    let completed: number = 0,
                        cancelled: number = 0;
                    if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.COMPLETED))
                        completed = groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.COMPLETED].length;
                    if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.CANCELLED))
                        cancelled = groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.CANCELLED].length;
                    if (deliveryDateKey != DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.NOT_YET_DISPATCHED) {
                        byDeliveryDateServiceTypeResults.push({
                            dispatchDate: deliveryDateKey,
                            total: groupByServiceType[serviceTypeKey].length,
                            completed: completed,
                            cancelled: cancelled,
                            serviceType: serviceTypeKey
                        });
                    } else {
                        let pending: number = 0,
                            in_progress: number = 0,
                            delayed: number = 0;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.DELAYED))
                            delayed = groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.DELAYED].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.AWAITING_PEER))
                            pending = groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.AWAITING_PEER].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.PEER_ASSIGNED))
                            in_progress +=
                                groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.PEER_ASSIGNED].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.OTW_TO_STORE))
                            in_progress +=
                                groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.OTW_TO_STORE].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.ORDER_PLACED))
                            in_progress +=
                                groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.ORDER_PLACED].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.FOR_PAYMENT))
                            in_progress += groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.FOR_PAYMENT].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.PAID))
                            in_progress += groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.PAID].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.FOR_DELIVERY))
                            in_progress +=
                                groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.FOR_DELIVERY].length;
                        byDeliveryDateServiceTypeResults.push({
                            dispatchDate: deliveryDateKey,
                            total: groupByServiceType[serviceTypeKey].length,
                            completed: completed,
                            cancelled: cancelled,
                            pending: pending,
                            in_progress: in_progress,
                            delayed: delayed,
                            serviceType: serviceTypeKey
                        });
                    }
                });

                const groupByCategory = _.groupBy(
                    groupByDeliveryDate[deliveryDateKey],
                    DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.CATEGORY
                );
                const categoryKeys = Object.keys(groupByCategory);
                categoryKeys.forEach((categoryKey: string) => {
                    const groupByStatus = _.groupBy(
                        groupByCategory[categoryKey],
                        DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.STATUS
                    );
                    const statusKeys = Object.keys(groupByStatus);
                    let completed: number = 0,
                        cancelled: number = 0;
                    if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.COMPLETED))
                        completed = groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.COMPLETED].length;
                    if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.CANCELLED))
                        cancelled = groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.CANCELLED].length;
                    if (deliveryDateKey != DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.NOT_YET_DISPATCHED) {
                        byDeliveryDateCategoryResults.push({
                            dispatchDate: deliveryDateKey,
                            total: groupByCategory[categoryKey].length,
                            completed: completed,
                            cancelled: cancelled,
                            category: categoryKey
                        });
                    } else {
                        let pending: number = 0,
                            in_progress: number = 0,
                            delayed: number = 0;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.DELAYED))
                            delayed = groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.DELAYED].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.AWAITING_PEER))
                            pending = groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.AWAITING_PEER].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.PEER_ASSIGNED))
                            in_progress +=
                                groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.PEER_ASSIGNED].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.OTW_TO_STORE))
                            in_progress +=
                                groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.OTW_TO_STORE].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.ORDER_PLACED))
                            in_progress +=
                                groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.ORDER_PLACED].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.FOR_PAYMENT))
                            in_progress += groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.FOR_PAYMENT].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.PAID))
                            in_progress += groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.PAID].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.FOR_DELIVERY))
                            in_progress +=
                                groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.FOR_DELIVERY].length;
                        byDeliveryDateCategoryResults.push({
                            dispatchDate: deliveryDateKey,
                            total: groupByCategory[categoryKey].length,
                            completed: completed,
                            cancelled: cancelled,
                            pending: pending,
                            in_progress: in_progress,
                            delayed: delayed,
                            category: categoryKey
                        });
                    }
                });

                const byPeerAssignedStatusResults: any = [];
                const groupByPeerAssigned = _.groupBy(
                    groupByDeliveryDate[deliveryDateKey],
                    DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.PEER_ASSIGNED
                );
                const peerAssignedKeys = Object.keys(groupByPeerAssigned);
                peerAssignedKeys.forEach((peerAssignedKey: string) => {
                    const groupByStatus = _.groupBy(
                        groupByPeerAssigned[peerAssignedKey],
                        DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.STATUS
                    );
                    const statusKeys = Object.keys(groupByStatus);
                    let completed: number = 0,
                        cancelled: number = 0;
                    if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.COMPLETED))
                        completed = groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.COMPLETED].length;
                    if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.CANCELLED))
                        cancelled = groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.CANCELLED].length;
                    if (deliveryDateKey != DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.NOT_YET_DISPATCHED) {
                        byPeerAssignedStatusResults.push({
                            peerAssigned: peerAssignedKey,
                            total: groupByPeerAssigned[peerAssignedKey].length,
                            completed: completed,
                            cancelled: cancelled
                        });
                    } else {
                        let pending: number = 0,
                            in_progress: number = 0,
                            delayed: number = 0;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.DELAYED))
                            delayed = groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.DELAYED].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.AWAITING_PEER))
                            pending = groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.AWAITING_PEER].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.PEER_ASSIGNED))
                            in_progress +=
                                groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.PEER_ASSIGNED].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.OTW_TO_STORE))
                            in_progress +=
                                groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.OTW_TO_STORE].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.ORDER_PLACED))
                            in_progress +=
                                groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.ORDER_PLACED].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.FOR_PAYMENT))
                            in_progress += groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.FOR_PAYMENT].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.PAID))
                            in_progress += groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.PAID].length;
                        if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.FOR_DELIVERY))
                            in_progress +=
                                groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.FOR_DELIVERY].length;
                        byPeerAssignedStatusResults.push({
                            peerAssigned: peerAssignedKey,
                            total: groupByPeerAssigned[peerAssignedKey].length,
                            completed: completed,
                            cancelled: cancelled,
                            pending: pending,
                            in_progress: in_progress,
                            delayed: delayed
                        });
                    }
                });

                byPeerAssignedResults.push({
                    dispatchDate: deliveryDateKey,
                    peersAssigned: byPeerAssignedStatusResults
                });

                const origins: any = this.sortOutTicketsPerDestinations(
                    groupByDeliveryDate[deliveryDateKey],
                    DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.PICK_UP_ADDRESS
                );
                const destinations: any = this.sortOutTicketsPerDestinations(
                    groupByDeliveryDate[deliveryDateKey],
                    DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.KEYS.DROP_OFF_ADDRESS
                );
                byLocationResults.push({
                    dispatchDate: deliveryDateKey,
                    origins: origins,
                    destinations: destinations
                });
            });

            let pending: number = 0,
                in_progress: number = 0,
                delayed: number = 0,
                completed: number = 0,
                cancelled: number = 0;
            if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.DELAYED))
                delayed = groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.DELAYED].length;
            if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.AWAITING_PEER))
                pending = groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.AWAITING_PEER].length;
            if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.PEER_ASSIGNED))
                in_progress += groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.PEER_ASSIGNED].length;
            if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.OTW_TO_STORE))
                in_progress += groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.OTW_TO_STORE].length;
            if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.ORDER_PLACED))
                in_progress += groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.ORDER_PLACED].length;
            if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.FOR_PAYMENT))
                in_progress += groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.FOR_PAYMENT].length;
            if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.PAID))
                in_progress += groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.PAID].length;
            if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.FOR_DELIVERY))
                in_progress += groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.FOR_DELIVERY].length;
            if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.COMPLETED))
                completed = groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.COMPLETED].length;
            if (statusKeys.includes(DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.CANCELLED))
                cancelled = groupByStatus[DYNAMODB.OLDDEV_BRAD_REQUESTS_TABLE.STATUS.CANCELLED].length;

            byCreatedAtResults.push({
                ticketCreatedAt: createdAtKey,
                total: groupByCreatedAt[createdAtKey].length,
                completed: completed,
                cancelled: cancelled,
                pending: pending,
                in_progress: in_progress,
                delayed: delayed,
                serviceTypeDispatchDates: byDeliveryDateServiceTypeResults,
                categoryDispatchDates: byDeliveryDateCategoryResults,
                peersAssigned: byPeerAssignedResults,
                locations: byLocationResults
            });
        });
        return byCreatedAtResults;
    }

    public static putAllDataInArrayWithoutNoDeliveryDates(sourceItems: any[], resultArr: any[], key: string) {
        const serviceTypeDispatchDates: any[] = [];
        sourceItems.forEach((item: any) => {
            serviceTypeDispatchDates.push(...item[key]);
        });
        const groupByDispatchDate: any = _.groupBy(
            serviceTypeDispatchDates,
            DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.DISPATCH_DATE
        );
        const dispatchDateKeys: string[] = Object.keys(groupByDispatchDate).sort();
        dispatchDateKeys.forEach((dispatchDateKey: string) => {
            groupByDispatchDate[dispatchDateKey].forEach((item: any) => {
                if (item.dispatchDate != DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.NOT_YET_DISPATCHED) resultArr.push(item);
            });
        });
    }

    public static sortServiceTypeDispatchDates(
        serviceTypeDispatchDateData: any[],
        results: any[],
        serviceType?: string
    ) {
        const groupByDispatchDate = _.mapValues(
            _.groupBy(serviceTypeDispatchDateData, DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.DISPATCH_DATE),
            (dispatchDateList) =>
                dispatchDateList.map((dispatchDate) =>
                    _.omit(dispatchDate, DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.DISPATCH_DATE)
                )
        );
        const dispatchDateKeys = Object.keys(groupByDispatchDate);
        dispatchDateKeys.forEach((dispatchDateKey: string) => {
            if (!serviceType) {
                results.push({
                    dispatchDate: dispatchDateKey,
                    total: groupByDispatchDate[dispatchDateKey].reduce((acc: any, obj: any) => acc + obj.total, 0),
                    completed: groupByDispatchDate[dispatchDateKey].reduce(
                        (acc: any, obj: any) => acc + obj.completed,
                        0
                    ),
                    cancelled: groupByDispatchDate[dispatchDateKey].reduce(
                        (acc: any, obj: any) => acc + obj.cancelled,
                        0
                    )
                });
            } else {
                const service: any = _.find(groupByDispatchDate[dispatchDateKey], {
                    serviceType: serviceType
                });
                results.push({
                    dispatchDate: dispatchDateKey,
                    total: service ? service.total : 0,
                    completed: service ? service.completed : 0,
                    cancelled: service ? service.cancelled : 0
                });
            }
        });
    }

    public static sortCategoryDispatchDates(categoryDispatchDateData: any[], results: any[], category?: string) {
        const groupByDispatchDate = _.mapValues(
            _.groupBy(categoryDispatchDateData, DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.DISPATCH_DATE),
            (dispatchDateList) =>
                dispatchDateList.map((dispatchDate) =>
                    _.omit(dispatchDate, DYNAMODB.ABSI_AGGREGATED_DATE_PER_DAY.KEYS.DISPATCH_DATE)
                )
        );
        const dispatchDateKeys = Object.keys(groupByDispatchDate);
        dispatchDateKeys.forEach((dispatchDateKey: string) => {
            if (!category) {
                results.push({
                    dispatchDate: dispatchDateKey,
                    total: groupByDispatchDate[dispatchDateKey].reduce((acc: any, obj: any) => acc + obj.total, 0),
                    completed: groupByDispatchDate[dispatchDateKey].reduce(
                        (acc: any, obj: any) => acc + obj.completed,
                        0
                    ),
                    cancelled: groupByDispatchDate[dispatchDateKey].reduce(
                        (acc: any, obj: any) => acc + obj.cancelled,
                        0
                    )
                });
            } else {
                const categ: any = _.find(groupByDispatchDate[dispatchDateKey], {
                    category: category
                });
                results.push({
                    dispatchDate: dispatchDateKey,
                    total: categ ? categ.total : 0,
                    completed: categ ? categ.completed : 0,
                    cancelled: categ ? categ.cancelled : 0
                });
            }
        });
    }

    public static filterDates(
        inputArr: any,
        month: number | null,
        date: number | null,
        year: number | null,
        toMonth?: number | null,
        toDate?: number | null,
        toYear?: number | null
    ) {
        return _.filter(inputArr, (item: any) => {
            const splitDispatchDate = item.dispatchDate.split("/");
            if (month && date && year) {
                if (!toMonth && !toDate && !toYear) return item.dispatchDate.startsWith(`${month}/${date}/${year}`);
                else if (toMonth && toDate && toYear)
                    return (
                        moment(item.dispatchDate, FORMATS.TIME.MMDDYYYY).isBetween(
                            moment(`${month}/${date}/${year}`, FORMATS.TIME.MMDDYYYY),
                            moment(`${toMonth}/${toDate}/${toYear}`, FORMATS.TIME.MMDDYYYY)
                        ) ||
                        item.dispatchDate.startsWith(`${month}/${date}/${year}`) ||
                        item.dispatchDate.startsWith(`${toMonth}/${toDate}/${toYear}`)
                    );
            }
            if (month && date) {
                const monthDate = `${splitDispatchDate[0]}/${splitDispatchDate[1]}`;
                if (!toMonth && !toDate) return monthDate.startsWith(`${month}/${date}`);
                else if (toMonth && toDate)
                    return (
                        moment(monthDate, FORMATS.TIME.MMDD).isBetween(
                            moment(`${month}/${date}`, FORMATS.TIME.MMDD),
                            moment(`${toMonth}/${toDate}`, FORMATS.TIME.MMDD)
                        ) ||
                        item.dispatchDate.startsWith(`${month}/${date}`) ||
                        item.dispatchDate.startsWith(`${toMonth}/${toDate}`)
                    );
            }
            if (month && year) {
                const monthYear = `${splitDispatchDate[0]}/${splitDispatchDate[2]}`;
                if (!toMonth && !toYear) return monthYear.endsWith(`${month}/${year}`);
                else if (toMonth && toYear)
                    return (
                        moment(monthYear, FORMATS.TIME.MMYYYY).isBetween(
                            moment(`${month}/${year}`, FORMATS.TIME.MMYYYY),
                            moment(`${toMonth}/${toYear}`, FORMATS.TIME.MMYYYY)
                        ) ||
                        item.dispatchDate.endsWith(`${month}/${year}`) ||
                        item.dispatchDate.endsWith(`${toMonth}/${toYear}`)
                    );
            }
            if (date && year) {
                const dateYear = `${splitDispatchDate[1]}/${splitDispatchDate[2]}`;
                if (!toDate && !toYear) return dateYear.startsWith(`${date}/`) && dateYear.endsWith(`/${year}`);
                else if (toDate && toYear)
                    return (
                        moment(dateYear, FORMATS.TIME.DDYYYY).isBetween(
                            moment(`${date}/${year}`, FORMATS.TIME.DDYYYY),
                            moment(`${toDate}/${toYear}`, FORMATS.TIME.DDYYYY)
                        ) ||
                        (item.dispatchDate.startsWith(`${date}/`) && item.dispatchDate.endsWith(`/${year}`)) ||
                        (item.dispatchDate.startsWith(`${toDate}/`) && item.dispatchDate.endsWith(`/${toYear}`))
                    );
            }
            if (month) {
                const monthItem = `${splitDispatchDate[0]}`;
                if (!toMonth) return monthItem.startsWith(month.toString());
                else
                    return (
                        moment(monthItem, FORMATS.TIME.MM).isBetween(
                            moment(month, FORMATS.TIME.MM),
                            moment(toMonth, FORMATS.TIME.MM)
                        ) ||
                        item.dispatchDate.startsWith(month.toString()) ||
                        item.dispatchDate.startsWith(toMonth.toString())
                    );
            }
            if (date) {
                const dateItem = `${splitDispatchDate[1]}`;
                if (!toDate) return dateItem.includes(`/${date}/`);
                else
                    return (
                        moment(dateItem, FORMATS.TIME.DD).isBetween(
                            moment(date, FORMATS.TIME.DD),
                            moment(toDate, FORMATS.TIME.DD)
                        ) ||
                        item.dispatchDate.includes(`/${date}/`) ||
                        item.dispatchDate.includes(`/${toDate}/`)
                    );
            }
            if (year) {
                const yearItem = `${splitDispatchDate[2]}`;
                if (!toYear) return yearItem.endsWith(`/${year}`);
                else
                    return (
                        moment(yearItem, FORMATS.TIME.YYYY).isBetween(
                            moment(year, FORMATS.TIME.YYYY),
                            moment(toYear, FORMATS.TIME.YYYY)
                        ) ||
                        item.dispatchDate.endsWith(`/${year}`) ||
                        item.dispatchDate.endsWith(`/${toYear}`)
                    );
            }
        });
    }
}
