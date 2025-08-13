import { TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';

import { LaunchBrowserTask } from '@/lib/workflow/task/launch-browser';
import { PageToHtmlTask } from '@/lib/workflow/task/page-to-html';
import { ExtractTextFromElementTask } from '@/lib/workflow/task/extract-text-from-element';
import { FillInputTask } from '@/lib/workflow/task/fill-input';
import { ClickElementTask } from '@/lib/workflow/task/click-element';
import { WaitForElementTask } from '@/lib/workflow/task/wait-for-element';
import { DeliverViaWebhookTask } from '@/lib/workflow/task/deliver-via-webhook';
import { ExtractDataWithAiTask } from '@/lib/workflow/task/extract-data-with-ai';
import { ReadPropertyFromJsonTask } from '@/lib/workflow/task/read-property-from-json';
import { AddPropertyToJsonTask } from '@/lib/workflow/task/add-property-to-json';
import { NavigateUrlTask } from '@/lib/workflow/task/navigate-url';
import { ScreenshotTask } from '@/lib/workflow/task/screenshot';
import { EvaluateJsTask } from '@/lib/workflow/task/evaluate-js';
import { SetViewportTask } from '@/lib/workflow/task/set-viewport';
import { SetUserAgentTask } from '@/lib/workflow/task/set-user-agent';
import { SetCookiesTask } from '@/lib/workflow/task/set-cookies';
import { SetLocalStorageTask } from '@/lib/workflow/task/set-local-storage';
import { HoverElementTask } from '@/lib/workflow/task/hover-element';
import { KeyboardTypeTask } from '@/lib/workflow/task/keyboard-type';
import { WaitForNetworkIdleTask } from '@/lib/workflow/task/wait-for-network-idle';
import { WaitForNavigationTask } from '@/lib/workflow/task/wait-for-navigation';
import { HttpRequestTask } from '@/lib/workflow/task/http-request';
import { ExtractAttributesTask } from '@/lib/workflow/task/extract-attributes';
import { ExtractListTask } from '@/lib/workflow/task/extract-list';
import { RegexExtractTask } from '@/lib/workflow/task/regex-extract';
import { InfiniteScrollTask } from '@/lib/workflow/task/infinite-scroll';
import { DelayTask } from '@/lib/workflow/task/delay';
import { ScrollToElementTask } from '@/lib/workflow/task/scroll-to-element';
import { DisplayDataTask } from '@/lib/workflow/task/display-data';
import { StoreDataTask } from '@/lib/workflow/task/store-data';
import { RetrieveDataTask } from '@/lib/workflow/task/retrieve-data';

type Registry = {
  [K in TaskType]: WorkflowTask & { type: K };
};

export const TaskRegistry: Registry = {
  LAUNCH_BROWSER: LaunchBrowserTask,
  PAGE_TO_HTML: PageToHtmlTask,
  EXTRACT_TEXT_FROM_ELEMENT: ExtractTextFromElementTask,
  FILL_INPUT: FillInputTask,
  CLICK_ELEMENT: ClickElementTask,
  WAIT_FOR_ELEMENT: WaitForElementTask,
  DELIVER_VIA_WEBHOOK: DeliverViaWebhookTask,
  EXTRACT_DATA_WITH_AI: ExtractDataWithAiTask,
  READ_PROPERTY_FROM_JSON: ReadPropertyFromJsonTask,
  ADD_PROPERTY_TO_JSON: AddPropertyToJsonTask,
  NAVIGATE_URL: NavigateUrlTask,
  SCROLL_TO_ELEMENT: ScrollToElementTask,
  SCREENSHOT: ScreenshotTask,
  EVALUATE_JS: EvaluateJsTask,
  SET_VIEWPORT: SetViewportTask,
  SET_USER_AGENT: SetUserAgentTask,
  SET_COOKIES: SetCookiesTask,
  SET_LOCAL_STORAGE: SetLocalStorageTask,
  HOVER_ELEMENT: HoverElementTask,
  KEYBOARD_TYPE: KeyboardTypeTask,
  WAIT_FOR_NETWORK_IDLE: WaitForNetworkIdleTask,
  WAIT_FOR_NAVIGATION: WaitForNavigationTask,
  HTTP_REQUEST: HttpRequestTask,
  EXTRACT_ATTRIBUTES: ExtractAttributesTask,
  EXTRACT_LIST: ExtractListTask,
  REGEX_EXTRACT: RegexExtractTask,
  INFINITE_SCROLL: InfiniteScrollTask,
  DELAY: DelayTask,
  DISPLAY_DATA: DisplayDataTask,
  STORE_DATA: StoreDataTask,
  RETRIEVE_DATA: RetrieveDataTask,
};
