export interface ResponseCreateCompanyApidian {
    success: boolean;
    message: string;
    password: string;
    token: string;
    company: Company;
}

export interface Company {
    id: number;
    user_id: number;
    identification_number: string;
    dv: string;
    language_id: number;
    tax_id: number;
    type_environment_id: number;
    payroll_type_environment_id: number;
    eqdocs_type_environment_id: number;
    type_operation_id: number;
    type_document_identification_id: number;
    country_id: number;
    type_currency_id: number;
    type_organization_id: number;
    type_regime_id: number;
    type_liability_id: number;
    municipality_id: number;
    merchant_registration: string;
    address: string;
    phone: string;
    password: null;
    newpassword: null;
    type_plan_id: number;
    type_plan2_id: number;
    type_plan3_id: number;
    type_plan4_id: number;
    start_plan_date: null;
    start_plan_date2: null;
    start_plan_date3: null;
    start_plan_date4: null;
    absolut_start_plan_date: null;
    state: number;
    allow_seller_login: number;
    created_at: Date;
    updated_at: Date;
    consumption: number;
    dealer_id: number;
    user: User;
    send: Send[];
}

export interface Send {
    id: number;
    year: number;
    next_consecutive: number;
    created_at: Date;
    updated_at: Date;
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: null;
    created_at: Date;
    updated_at: Date;
    id_administrator: null;
    mail_host: string;
    mail_port: string;
    mail_username: string;
    mail_password: string;
    mail_encryption: string;
}
