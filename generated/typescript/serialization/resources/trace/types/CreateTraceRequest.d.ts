/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../..";
import * as FintoLangfuse from "../../../../api";
import * as core from "../../../../core";
export declare const CreateTraceRequest: core.serialization.ObjectSchema<serializers.CreateTraceRequest.Raw, FintoLangfuse.CreateTraceRequest>;
export declare namespace CreateTraceRequest {
    interface Raw {
        name: string;
        attributes?: unknown;
        status: string;
        statusMessage?: string | null;
    }
}