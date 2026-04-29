import { Electroview } from "electrobun/view";
import type { FinanceRPC } from "../../shared/rpc";

const rpc = Electroview.defineRPC<FinanceRPC>({
	handlers: {
		requests: {},
		messages: {},
	},
});

export const electroview = new Electroview({ rpc });
