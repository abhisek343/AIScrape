import { ExecutionEnvironment } from '@/types/executor';
import { TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';

import { LaunchBrowserExecutor } from '@/lib/workflow/executor/launch-browser-executor';
import { PageToHtmlExecutor } from '@/lib/workflow/executor/page-to-html-executor';
import { ExtractTextFromElementExecutor } from '@/lib/workflow/executor/extract-text-from-element-executor';
import { FillInputExecutor } from '@/lib/workflow/executor/fill-input-executor';
import { ClickElementExecutor } from '@/lib/workflow/executor/click-element-executor';
import { WaitForElementExecutor } from '@/lib/workflow/executor/wait-for-element-executor';
import { DeliverViaWebhookExecutor } from '@/lib/workflow/executor/deliver-via-webhook-executor';
import { ExtractDataWithAiExecutor } from '@/lib/workflow/executor/extract-data-with-ai-executor';
import { ReadPropertyFromJsonExecutor } from '@/lib/workflow/executor/read-property-from-json-executor';
import { AddPropertyToJsonExecutor } from '@/lib/workflow/executor/add-property-to-json-executor';
import { NavigateUrlExecutor } from '@/lib/workflow/executor/navigate-url-executor';
import { ScrollToElementExecutor } from '@/lib/workflow/executor/scroll-to-element-executor';
import { ScreenshotExecutor } from '@/lib/workflow/executor/screenshot-executor';
import { EvaluateJsExecutor } from '@/lib/workflow/executor/evaluate-js-executor';
import { SetViewportExecutor } from '@/lib/workflow/executor/set-viewport-executor';
import { SetUserAgentExecutor } from '@/lib/workflow/executor/set-user-agent-executor';
import { SetCookiesExecutor } from '@/lib/workflow/executor/set-cookies-executor';
import { SetLocalStorageExecutor } from '@/lib/workflow/executor/set-local-storage-executor';
import { HoverElementExecutor } from '@/lib/workflow/executor/hover-element-executor';
import { KeyboardTypeExecutor } from '@/lib/workflow/executor/keyboard-type-executor';
import { WaitForNetworkIdleExecutor } from '@/lib/workflow/executor/wait-for-network-idle-executor';
import { WaitForNavigationExecutor } from '@/lib/workflow/executor/wait-for-navigation-executor';
import { HttpRequestExecutor } from '@/lib/workflow/executor/http-request-executor';
import { ExtractAttributesExecutor } from '@/lib/workflow/executor/extract-attributes-executor';
import { ExtractListExecutor } from '@/lib/workflow/executor/extract-list-executor';
import { RegexExtractExecutor } from '@/lib/workflow/executor/regex-extract-executor';
import { InfiniteScrollExecutor } from '@/lib/workflow/executor/infinite-scroll-executor';
import { DelayExecutor } from '@/lib/workflow/executor/delay-executor';
import { DisplayDataExecutor } from '@/lib/workflow/executor/display-data-executor';
import { StoreDataExecutor } from '@/lib/workflow/executor/store-data-executor';
import { RetrieveDataExecutor } from '@/lib/workflow/executor/retrieve-data-executor';

type ExecuterFn<T extends WorkflowTask> = (environment: ExecutionEnvironment<T>) => Promise<boolean>;

type RegistryType = {
  [K in TaskType]: ExecuterFn<WorkflowTask & { type: K }>;
};

export const ExecutorRegistry: RegistryType = {
  LAUNCH_BROWSER: LaunchBrowserExecutor,
  PAGE_TO_HTML: PageToHtmlExecutor,
  EXTRACT_TEXT_FROM_ELEMENT: ExtractTextFromElementExecutor,
  FILL_INPUT: FillInputExecutor,
  CLICK_ELEMENT: ClickElementExecutor,
  WAIT_FOR_ELEMENT: WaitForElementExecutor,
  DELIVER_VIA_WEBHOOK: DeliverViaWebhookExecutor,
  EXTRACT_DATA_WITH_AI: ExtractDataWithAiExecutor,
  READ_PROPERTY_FROM_JSON: ReadPropertyFromJsonExecutor,
  ADD_PROPERTY_TO_JSON: AddPropertyToJsonExecutor,
  NAVIGATE_URL: NavigateUrlExecutor,
  SCROLL_TO_ELEMENT: ScrollToElementExecutor,
  SCREENSHOT: ScreenshotExecutor,
  EVALUATE_JS: EvaluateJsExecutor,
  SET_VIEWPORT: SetViewportExecutor,
  SET_USER_AGENT: SetUserAgentExecutor,
  SET_COOKIES: SetCookiesExecutor,
  SET_LOCAL_STORAGE: SetLocalStorageExecutor,
  HOVER_ELEMENT: HoverElementExecutor,
  KEYBOARD_TYPE: KeyboardTypeExecutor,
  WAIT_FOR_NETWORK_IDLE: WaitForNetworkIdleExecutor,
  WAIT_FOR_NAVIGATION: WaitForNavigationExecutor,
  HTTP_REQUEST: HttpRequestExecutor,
  EXTRACT_ATTRIBUTES: ExtractAttributesExecutor,
  EXTRACT_LIST: ExtractListExecutor,
  REGEX_EXTRACT: RegexExtractExecutor,
  INFINITE_SCROLL: InfiniteScrollExecutor,
  DELAY: DelayExecutor,
  DISPLAY_DATA: DisplayDataExecutor,
  STORE_DATA: StoreDataExecutor,
  RETRIEVE_DATA: RetrieveDataExecutor,
};
