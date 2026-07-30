import math

UNITS_MAP = {
    "pressure": {
        "psi": 1.0,
        "bar": 14.5038,
        "kPa": 0.145038,
        "MPa": 145.038,
        "atm": 14.6959
    },
    "length": {
        "ft": 1.0,
        "m": 3.28084,
        "in": 0.0833333,
        "km": 3280.84
    },
    "volume": {
        "bbl": 1.0,
        "m3": 6.28981,
        "ft3": 0.178108,
        "gal": 0.0238095
    },
    "flow_rate": {
        "bbl/d": 1.0,
        "m3/d": 6.28981,
        "Mscf/d": 0.178108,
        "MMscf/d": 178.108
    },
    "viscosity": {
        "cp": 1.0,
        "mPa.s": 1.0,
        "Pa.s": 1000.0
    },
    "permeability": {
        "md": 1.0,
        "D": 1000.0,
        "m2": 1.01325e15
    },
    "density": {
        "lbm/gal": 1.0,
        "lbm/ft3": 0.133681,
        "g/cm3": 8.3454,
        "kg/m3": 0.0083454
    }
}

def convert_units(value: float, category: str, from_unit: str, to_unit: str):
    if category == "temperature":
        if from_unit == "degF" and to_unit == "degC":
            res = (value - 32) * 5/9
        elif from_unit == "degC" and to_unit == "degF":
            res = (value * 9/5) + 32
        elif from_unit == "degF" and to_unit == "K":
            res = (value - 32) * 5/9 + 273.15
        elif from_unit == "K" and to_unit == "degF":
            res = (value - 273.15) * 9/5 + 32
        elif from_unit == "degC" and to_unit == "K":
            res = value + 273.15
        elif from_unit == "K" and to_unit == "degC":
            res = value - 273.15
        else:
            res = value
        return {
            "value": round(res, 4),
            "formula": f"Temperature conversion from {from_unit} to {to_unit}"
        }

    if category not in UNITS_MAP:
        raise ValueError(f"Category '{category}' not supported.")
    cat = UNITS_MAP[category]
    if from_unit not in cat or to_unit not in cat:
        raise ValueError(f"Units {from_unit} or {to_unit} not found in category {category}")

    base_val = value * cat[from_unit]
    converted = base_val / cat[to_unit]
    return {
        "value": round(converted, 4),
        "formula": f"{value} {from_unit} * ({cat[from_unit]} / {cat[to_unit]}) = {round(converted, 4)} {to_unit}"
    }

def calculate_darcy_liquid(k_md: float, h_ft: float, p_diff_psi: float, mu_cp: float, b_vol: float, r_w_ft: float = 0.33, r_e_ft: float = 660.0):
    """
    Darcy's Law for Radial Liquid Flow:
    q (STB/D) = (0.00708 * k * h * (Pe - Pwf)) / (mu * B * ln(re / rw))
    """
    if mu_cp <= 0 or b_vol <= 0 or r_w_ft <= 0 or r_e_ft <= r_w_ft:
        raise ValueError("Invalid physical input parameters for Darcy calculation.")
    
    ln_ratio = math.log(r_e_ft / r_w_ft)
    numerator = 0.00708 * k_md * h_ft * p_diff_psi
    denominator = mu_cp * b_vol * ln_ratio
    q = numerator / denominator
    
    return {
        "flow_rate_stbd": round(q, 2),
        "formula": "q = (0.00708 * k * h * ΔP) / (μ * B * ln(re/rw))",
        "variables": {
            "k_md": k_md,
            "h_ft": h_ft,
            "p_diff_psi": p_diff_psi,
            "mu_cp": mu_cp,
            "b_vol": b_vol,
            "re_rw_ratio": round(r_e_ft / r_w_ft, 2)
        },
        "steps": [
            f"1. Compute ln(re/rw) = ln({r_e_ft}/{r_w_ft}) = {round(ln_ratio, 4)}",
            f"2. Compute Numerator = 0.00708 * {k_md} * {h_ft} * {p_diff_psi} = {round(numerator, 4)}",
            f"3. Compute Denominator = {mu_cp} * {b_vol} * {round(ln_ratio, 4)} = {round(denominator, 4)}",
            f"4. Result q = {round(q, 2)} STB/D"
        ],
        "reference": "Petroleum Engineering Handbook Vol 1 (Ch. 3) & Vol 5 (Ch. 5)"
    }

def calculate_hydrostatic_pressure(mud_weight_ppg: float, tvd_ft: float):
    """
    P_hydrostatic (psi) = 0.052 * Mud Weight (ppg) * TVD (ft)
    """
    p_hydro = 0.052 * mud_weight_ppg * tvd_ft
    gradient = 0.052 * mud_weight_ppg
    return {
        "pressure_psi": round(p_hydro, 2),
        "gradient_psi_ft": round(gradient, 4),
        "formula": "P = 0.052 * MW * TVD",
        "variables": {"MW_ppg": mud_weight_ppg, "TVD_ft": tvd_ft},
        "steps": [
            f"1. Pressure Gradient = 0.052 * {mud_weight_ppg} = {round(gradient, 4)} psi/ft",
            f"2. Total Hydrostatic Pressure = {round(gradient, 4)} * {tvd_ft} = {round(p_hydro, 2)} psi"
        ],
        "reference": "Petroleum Engineering Handbook Vol 2 (Drilling Engineering Ch. 1)"
    }

def calculate_productivity_index(q_stbd: float, p_res_psi: float, p_wf_psi: float):
    """
    PI (STB/D/psi) = q / (P_res - P_wf)
    """
    dp = p_res_psi - p_wf_psi
    if dp <= 0:
        raise ValueError("Reservoir pressure must be strictly greater than bottomhole flowing pressure.")
    pi = q_stbd / dp
    return {
        "productivity_index": round(pi, 3),
        "drawdown_psi": round(dp, 2),
        "formula": "J = q / (P_res - P_wf)",
        "variables": {"q_stbd": q_stbd, "P_res": p_res_psi, "P_wf": p_wf_psi},
        "steps": [
            f"1. Drawdown ΔP = {p_res_psi} - {p_wf_psi} = {round(dp, 2)} psi",
            f"2. J = {q_stbd} / {round(dp, 2)} = {round(pi, 3)} STB/D/psi"
        ],
        "reference": "Petroleum Engineering Handbook Vol 4 (Production Operations Ch. 1)"
    }

def calculate_api_gravity(sg_water_1: float):
    """
    API = (141.5 / SG) - 131.5
    """
    if sg_water_1 <= 0:
        raise ValueError("Specific gravity must be positive.")
    api = (141.5 / sg_water_1) - 131.5
    return {
        "api_degrees": round(api, 2),
        "formula": "API = (141.5 / SG) - 131.5",
        "variables": {"specific_gravity": sg_water_1},
        "steps": [
            f"1. API = (141.5 / {sg_water_1}) - 131.5 = {round(api, 2)}°API"
        ],
        "reference": "Petroleum Engineering Handbook Vol 1 (General Engineering)"
    }
