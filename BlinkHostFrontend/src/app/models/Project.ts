export interface Project {
    id: number;
    name: string;
    ip: string;
    port: number;
    is_Active: boolean;
    created_on: string;
    dynamic_routing: boolean;
    httpSecured: boolean;
}