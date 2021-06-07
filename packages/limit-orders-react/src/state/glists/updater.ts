import { useAllLists } from "./hooks";
import {
  getVersionUpgrade,
  minVersionBump,
  VersionUpgrade,
} from "@uniswap/token-lists";
import { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Web3Provider } from "@ethersproject/providers";
import { useFetchListCallback } from "../../hooks/useFetchListCallback";
import useInterval from "../../hooks/useInterval";
import useIsWindowVisible from "../../hooks/useIsWindowVisible";
import { AppDispatch } from "../index";
import { acceptListUpdate } from "./actions";
import { useActiveListUrls } from "./hooks";
import { UNSUPPORTED_LIST_URLS } from "../../constants/lists";

export default function Updater({
  library,
}: {
  library: Web3Provider | undefined;
}): null {
  const dispatch = useDispatch<AppDispatch>();
  const isWindowVisible = useIsWindowVisible();

  // get all loaded lists, and the active urls
  const lists = useAllLists();
  const activeListUrls = useActiveListUrls();

  const fetchList = useFetchListCallback();
  const fetchAllListsCallback = useCallback(() => {
    if (!isWindowVisible) return;
    if (!library) return;
    Object.keys(lists).forEach((url) =>
      fetchList(library, url).catch((error) =>
        console.debug("interval list fetching error", error)
      )
    );
  }, [fetchList, isWindowVisible, lists]);

  // fetch all lists every 10 minutes, but only after we initialize library
  useInterval(fetchAllListsCallback, library ? 1000 * 60 * 10 : null);

  // whenever a list is not loaded and not loading, try again to load it
  useEffect(() => {
    Object.keys(lists).forEach((listUrl) => {
      const list = lists[listUrl];
      if (!list.current && !list.loadingRequestId && !list.error) {
        if (!library) return;
        fetchList(library, listUrl).catch((error) =>
          console.debug("list added fetching error", error)
        );
      }
    });
  }, [dispatch, fetchList, library, lists]);

  // if any lists from unsupported lists are loaded, check them too (in case new updates since last visit)
  useEffect(() => {
    UNSUPPORTED_LIST_URLS.forEach((listUrl) => {
      const list = lists[listUrl];
      if (!list || (!list.current && !list.loadingRequestId && !list.error)) {
        if (!library) return;
        fetchList(library, listUrl).catch((error) =>
          console.debug("list added fetching error", error)
        );
      }
    });
  }, [dispatch, fetchList, library, lists]);

  // automatically update lists if versions are minor/patch
  useEffect(() => {
    Object.keys(lists).forEach((listUrl) => {
      const list = lists[listUrl];
      if (list.current && list.pendingUpdate) {
        const bump = getVersionUpgrade(
          list.current.version,
          list.pendingUpdate.version
        );
        switch (bump) {
          case VersionUpgrade.NONE:
            throw new Error("unexpected no version bump");
          case VersionUpgrade.PATCH:
          case VersionUpgrade.MINOR:
            // eslint-disable-next-line no-case-declarations
            const min = minVersionBump(
              list.current.tokens,
              list.pendingUpdate.tokens
            );
            // automatically update minor/patch as long as bump matches the min update
            if (bump >= min) {
              dispatch(acceptListUpdate(listUrl));
            } else {
              console.error(
                `List at url ${listUrl} could not automatically update because the version bump was only PATCH/MINOR while the update had breaking changes and should have been MAJOR`
              );
            }
            break;

          // update any active or inactive lists
          case VersionUpgrade.MAJOR:
            dispatch(acceptListUpdate(listUrl));
        }
      }
    });
  }, [dispatch, lists, activeListUrls]);

  return null;
}