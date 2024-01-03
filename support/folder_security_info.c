#include <node_api.h>
#include <windows.h>
#include <stdio.h>
#include <tchar.h>
#include <accctrl.h>
#include <aclapi.h>

napi_value GetFolderSecurityInfo(napi_env env, napi_callback_info info) {
    napi_status status;
    size_t argc = 1;
    napi_value args[1];
    status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);

    if (status != napi_ok || argc < 1) {
        napi_throw_type_error(env, NULL, "Folder path required");
        return NULL;
    }

    char folderPath[260];
    size_t str_size_copied;
    status = napi_get_value_string_utf8(env, args[0], folderPath, 260, &str_size_copied);

    if (status != napi_ok) {
        napi_throw_type_error(env, NULL, "Error reading folder path");
        return NULL;
    }

    // printf("Received folder path: %s\n", folderPath);

    // Actual logic to retrieve folder security info
    DWORD dwRes;
    PACL pACL = NULL;
    PSECURITY_DESCRIPTOR pSD = NULL;
    dwRes = GetNamedSecurityInfo(folderPath, SE_FILE_OBJECT, DACL_SECURITY_INFORMATION,
                                 NULL, NULL, &pACL, NULL, &pSD);

    if (ERROR_SUCCESS != dwRes) {
        printf("GetNamedSecurityInfo Error %u\n", dwRes);
        return NULL;
    }

    // napi_value result;
    // status = napi_create_object(env, &result);

    // if (status != napi_ok) {
    //     if (pSD != NULL) LocalFree((HLOCAL)pSD);
    //     napi_throw_error(env, NULL, "Failed to create result object");
    //     return NULL;
    // }
    napi_value resultArray;
    status = napi_create_array(env, &resultArray);
    if (status != napi_ok) {
        if (pSD != NULL) LocalFree((HLOCAL)pSD);
        napi_throw_error(env, NULL, "Failed to create result array");
        return NULL;
    }
    // Iterate through the ACL
    if (pACL != NULL) {
        for (DWORD i = 0; i < pACL->AceCount; i++) {
            ACCESS_ALLOWED_ACE *pAce = NULL;
            if (GetAce(pACL, i, (LPVOID *)&pAce)) {
                PSID pSid = (PSID)&pAce->SidStart;

                wchar_t AccountName[100], DomainName[100];
                DWORD cchAccountName = 100, cchDomainName = 100;
                SID_NAME_USE eUse;

                if (LookupAccountSidW(NULL, pSid, AccountName, &cchAccountName, DomainName, &cchDomainName, &eUse)) {
                    // Convert wide characters to UTF-8
                    int accountNameLength = WideCharToMultiByte(CP_UTF8, 0, AccountName, -1, NULL, 0, NULL, NULL);
                    char *utf8AccountName = (char *)malloc(accountNameLength);
                    WideCharToMultiByte(CP_UTF8, 0, AccountName, -1, utf8AccountName, accountNameLength, NULL, NULL);

                    int domainNameLength = WideCharToMultiByte(CP_UTF8, 0, DomainName, -1, NULL, 0, NULL, NULL);
                    char *utf8DomainName = (char *)malloc(domainNameLength);
                    WideCharToMultiByte(CP_UTF8, 0, DomainName, -1, utf8DomainName, domainNameLength, NULL, NULL);

                    napi_value userObject, jsAccountName, jsDomainName;
                    status = napi_create_object(env, &userObject);
                    status = napi_create_string_utf8(env, utf8AccountName, NAPI_AUTO_LENGTH, &jsAccountName);
                    status = napi_create_string_utf8(env, utf8DomainName, NAPI_AUTO_LENGTH, &jsDomainName);

                    free(utf8AccountName);
                    free(utf8DomainName);

                    status = napi_set_named_property(env, userObject, "accountName", jsAccountName);
                    status = napi_set_named_property(env, userObject, "domainName", jsDomainName);

                    // Add this userObject to the resultArray
                    status = napi_set_element(env, resultArray, i, userObject);
                }
            }
        }
    }

    if (pSD != NULL) LocalFree((HLOCAL)pSD);
    return resultArray;
}

napi_value Init(napi_env env, napi_value exports) {
    napi_status status;
    napi_value fn;

    status = napi_create_function(env, NULL, 0, GetFolderSecurityInfo, NULL, &fn);

    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Unable to wrap native function");
    }

    status = napi_set_named_property(env, exports, "getFolderSecurityInfo", fn);

    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Unable to populate exports");
    }

    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
