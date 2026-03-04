import Swal from "sweetalert2";

export const BRAND_CONFIRM_COLOR = "#497869";

const baseConfig = {
    customClass: {
        popup: "rounded-2xl shadow-2xl",
        title: "font-bold",
        htmlContainer: "text-sm",
        confirmButton: "font-semibold",
        cancelButton: "font-semibold",
    },
};

export const biText = (kh, en) => `${kh} (${en})`;

export const toastSuccess = async ({
    khTitle = "ជោគជ័យ",
    enTitle = "Success",
    khText,
    enText,
} = {}) => {
    return Swal.fire({
        ...baseConfig,
        icon: "success",
        title: biText(khTitle, enTitle),
        text: khText && enText ? biText(khText, enText) : undefined,
        position: "top-end",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
    });
};

export const errorAlert = async ({
    khTitle = "មានបញ្ហាបច្ចេកទេស",
    enTitle = "Something went wrong",
    khText = "សូមព្យាយាមម្តងទៀត",
    enText = "Please try again",
    detail,
} = {}) => {
    const text = detail ? `${biText(khText, enText)}\n${detail}` : biText(khText, enText);
    return Swal.fire({
        ...baseConfig,
        icon: "error",
        title: biText(khTitle, enTitle),
        text,
        confirmButtonColor: BRAND_CONFIRM_COLOR,
    });
};

export const warningConfirm = async ({
    khTitle = "សូមបញ្ជាក់សកម្មភាព",
    enTitle = "Please confirm",
    khText,
    enText,
    khConfirm = "បញ្ជាក់",
    enConfirm = "Confirm",
    khCancel = "បោះបង់",
    enCancel = "Cancel",
} = {}) => {
    return Swal.fire({
        ...baseConfig,
        icon: "warning",
        title: biText(khTitle, enTitle),
        text: khText && enText ? biText(khText, enText) : undefined,
        showCancelButton: true,
        confirmButtonText: biText(khConfirm, enConfirm),
        cancelButtonText: biText(khCancel, enCancel),
        confirmButtonColor: BRAND_CONFIRM_COLOR,
        cancelButtonColor: "#6b7280",
    });
};

export const loadingAlert = ({
    khTitle = "កំពុងដំណើរការ",
    enTitle = "Processing",
    khText = "សូមរង់ចាំបន្តិច",
    enText = "Please wait",
} = {}) => {
    Swal.fire({
        ...baseConfig,
        title: biText(khTitle, enTitle),
        text: biText(khText, enText),
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });
};

export const closeSwal = () => Swal.close();

export default Swal;
