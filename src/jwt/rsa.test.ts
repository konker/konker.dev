import * as P from '@konker.dev/effect-ts-prelude';

import { TEST_RSA_KEY_PRIVATE, TEST_RSA_KEY_PUBLIC, TEST_RSA_KEY_PUBLIC_OTHER } from '../test/fixtures';
import * as unit from './rsa';

const TEST_NOW_MS = 1671573808123;
const TEST_PAYLOAD = { foo: 'bar', sub: 'test-sub' };
const TEST_SIGNING_CONFIG: unit.JwtSigningConfigRsa = {
  rsaPrivateKey: TEST_RSA_KEY_PRIVATE,
  issuer: 'test-iss',
  maxTtlSec: 3600,
};
const TEST_VERIFICATION_CONFIG: unit.JwtVerificationConfigRsa = {
  rsaPublicKey: TEST_RSA_KEY_PUBLIC,
  issuer: 'test-iss',
};
const TEST_TOKEN =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJzdWIiOiJ0ZXN0LXN1YiIsImlhdCI6MTY3MTU3MzgwOCwiZXhwIjoxNjcxNTc3NDA4LCJpc3MiOiJ0ZXN0LWlzcyJ9.L_iuofq2Jt-DAmhwsMuoC4YqpcerPB8p6FHrWd8c7iAA25TiCCMPfFJ-sei0ES44qccfS1-aRKRCnthWKnUhtAsV8acwPE3x017nCoSrw_10tU3m2XrLwvz7QOvrBQYsu9-IhcRSCApJ0a9xy2To_oGjlGa9jcVO_E8MbL50Stf5XWHX6Jjt6MmQ7tVQLvcLAguWazCM7C0w3LNsG9GlGQnf4--wo_IDPok9ELkGR1rYok9p88QGrFjaYRkzV6so4L5RQUsfV_36EsiNekIFeUBJr_b3YoezIFZ-F_YxlZ1EaBtJ3O8rfySLcOQmiQR-iQ5jbs_WSPGrbw1ItPuxbjQwDVfEc3zn2GlwHYjaSaff6DyG_4tRmN96rqb4CGLFb9Nidc2FEeJc9RThc1Ygp65hxGQKM4I12k4jt7BzTfxhxmeRO7IJGFfH3-yJ-wGy1Vf9VWTi4SvjLa8jiF_9sWIaorifRSvvqaHqHjcI54EXlkmEG5BWfF5m4JrVoZhxLFohdlFW0HAP_oA3mKnI_QZUc1XVOtxpJwvo6ByM0A6A1pPdThWljfhZx7r56PSc2J5ZLkHKkavvMTjGaub1a1oLxsK0azX-xSg1fI8oy7yadVjyqY_0ArOhIYy22C1mwyBSLsSVylqig6go54PjVWh4JXepvMibmZQqZToayHA';
const TEST_SIGNED_PAYLOAD = {
  foo: 'bar',
  iat: Math.floor(TEST_NOW_MS / 1000),
  exp: Math.floor(TEST_NOW_MS / 1000) + 3600,
  iss: 'test-iss',
  sub: 'test-sub',
};
const TEST_TOKEN_EXPIRED =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJzdWIiOiJ0ZXN0LXN1YiIsImlhdCI6MTY3MTU3MzgwOCwiZXhwIjoxNjcxNTcxMzA4LCJpc3MiOiJ0ZXN0LWlzcyJ9.kVjkHPUhqd1UNOGeE8ovzegjqrFVymidv1tSzJoTkpmr_E9NELLsSRxppm4LQSFw5tDIzeqkI0zjmYxpCLuEwpAIxphF9JDEiViNGw_LjWVMh84lppUmJx0YU_cdLd5Xs71U0OgTHlWyz_amnQP3A7j0-pvbRY96E6s1NMp_lydQVeRxAWYRMficXALpJh7uZB8uq516nH1yGfWrGJyG1AUpgCP2VZbxavPHcYX5rGNmT0evbaxUxPM_NhSw10OqpZl7EbGEUEbjCSUW5crJxO5t6egG-bMZiQ868U2epCgRrpviCSduHlEiFOvTYa4yQFcgDexK1B9KuUXKttsdR60weGFmZZhiClEhN151fLdlj1HOH3JE8C8tDE0Eo0s7WAzPyWO52RFdGL_8ybzf8fawFhoUpCkRa6RlmVFj7XMHSW6i-KIPXJ1bMu7Z2Jf3MH_mNkzK_h_gh_me0OjjWLFVdKc3Ul0Di9AFk96zLjI9EEJ9bziXTOp6PoGEM-cC_vSf5tJqYqUjiGW6BPOfwvV8aHfUifc2ctf3qDXZjqVXtiPoZllEqxVV_M59AYcGYWTHo8t_JpX1N0FOcrx7kbR2huWPADTeZGHs4EM2-mbKjt06CQ9IrIlewNBsYAaHsmlMrsabJULAyOHSYtm-i5abP-qeMFpOqYlljiUwwGs';
const TEST_TOKEN_OTHER_ISSUER =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJzdWIiOiJ0ZXN0LXN1YiIsImlhdCI6MTY3MTU3MzgwOCwiZXhwIjoxNjcxNTc3NDA4LCJpc3MiOiJvdGhlci1pc3N1ZXIifQ.mwesZ-awkidNWD6rr0NuRYx9LmdPvfdyLOnEsEJAGaLiMdk9nz6FyXuNZfslGSU_Y8T8y8QqN100i-MxbJUeOJT8o00p2O0mkjkMyQJFeuaCazDoaWPyUqpfqKanj_D-saUeXlN1HXKgL2GNgAjc7LfIIT6lpZILpS7jqaGCyKprSer4ftNxgJOe47Exx6JlepOZ_Q-RreOd9vhjcWp06I4-hBBmz5BMzHf2oLCBR35NqLReNIuebIu_1CX95VVXK0Sv_9CMRKSXd8xtEIKmXqUXSPBx41oniC2ue0fe_vtGrpNAtles8kyWiNV5aR1cYpArCXeFnV8HoBZKDqNetCrMvN0N8EXX44rIRydXJP33R4UQTkt_Ap0Af6I4aFY9CIxK53Qtv9f9Os_0Xc8vs-KCf_zA46_jf34g-7wl68FnTMcpX04VwYjffaeLF-1EkplIu7f-vMPJmUvMA0ukC2yjBA7QjaUCOmOPZNmtxzlSov_D90W67UXea5neRCvDzOhPC5gdo7l8qjs7xXuuNf0QlVIqyfWWUeMNbYJcTaWZn_DmEGx_AMRTPwhXhLL-fIWoJQajbw_1PBbWohY_eONfD49SQtAE1tiE7PweG9mX-A3-bCp8Kx8SCTGs2iVZ2HgLOzPOleexxmpHIwvrnpsGMb3LGXuwTJ27RKe7Mnk';
const TEST_TOKEN_MISSING_ISSUER =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJzdWIiOiJ0ZXN0LXN1YiIsImlhdCI6MTY3MTU3MzgwOCwiZXhwIjoxNjcxNTc3NDA4fQ.kxDTeu4qZnCyandR-Z9k5xAsdtGCQT33w22FibCK3C8DMTLSRpRgHcjaN8gPOAjxkvPxvcF50mjNjxXP1I1yGt4zcBY3aMaRaCj44O1iUWv4K695sF3NOfHt244n5KKo4IG2mowGRRjQMjSNY95U6IkLt_2QKvpfEAIUxoU544jbXMXxkugiAbIH58uLAteMPqqLqn2OSpDucVC1pJgOpIFvfBQsrCaSLuANvtcj4AYgds2FnUtI_FqRTVIYQzg4gSxOQ9pDfOYZO_o2gg5LM4bgF-tXQN06avWENKO55b5QtigC3LeFXOqGXNRPLv-gQk06Hjm5C5tcY1mAkLI-eN7qg9ZrAXapBWpyrRnbhlI0oSqs1DjJkcm1yn71HgWL3P9LZZ6mrVxDOVnAFqkijMQum3L7fZ5MN6mKNXl9b2heXIGwoVG9I6NmuI36El40GGsN7X_Kq1wT2xBNpgo9r8TYgFlYYwFtH7ggGHc3y_KbVRpGGSO8AyTv_qxF7G7cKcZrRY_K_YfG84FL2x9R7rVb65xQSMuGX4b4GUvpats6r-29sVQ-NFWDD7NFNp5omwC-iwmQ0EoVtgs-yXK9H_kDgZBfxakHZNvqLA8XxMl6nk0kE7lgxCKFSwFRFRJVnJgx62qawSihUh7tMkdUxM5_XcsWLLrdFSlsSGAF0Gc';
const TEST_TOKEN_MISSING_SUBJECT =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE2NzE1NzM4MDgsImV4cCI6MTY3MTU3NzQwOCwiaXNzIjoidGVzdC1pc3MifQ.FXa6cgr8lKaZmGu3ObMoMJKwD9pYLuH-x0hPn1-Q56u2k1sAJMswcmY9viFGYdK2kh4130kSFrih-VxZ8sd_gawPQPJzty5OIHm27tky5971GYLGsonvjAsDyB-dlvenfFQ9POujq04GxNgvjzutQYrQIgok9wJ8eLjYUhACZOeOd659zhHKe_aONfc07YDAZFNyQFs_v68pEQOr1gGwpxEKw3pBkTLXAmsOtQdkS-Ngc1NPMs_5NkEGJO5IJ1DcdlzCP1QU9wnrK7q_IxsYaFPVmjmstzyhsJ1eD-ZQVFQStCz6wItNRBX2VKwSXyA0t7CXUwa6SNFRFtvOjIvxjZp1CP4pcO1qWGzX9Udibhvj9_pvga1J96GqNH2KY-ZU5PRaCCnrZ0Je_2Mea1-6XKP5ZcF38z6rp1xJ0jVZNVVQ0mdU9sCQLDmk0Q1Ao35Y7LyKXyDowFlVWqe91jqVdntBuf_QCL5OnFWoUT5w3G7mssqOFv_Az8mN-ADTQALVjhZDNIE8rVL_xazPAHWSdTyvSrqrXuhz5at-unO9DY7nOkl7f6QEPJPQvzNyAcBbc0XYkrtY2RwySuNHhH4vS4oqsPyfsP2bbw4y0K4QuWGh08gO_pzDtpFcBdVLo3IDoiSdlP1UGaOqDppRoXUxKVmXFUJPUtgKa55oHt3vHSs';
const TEST_TOKEN_STRING_PAYLOAD =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJzdWIiOiJ0ZXN0LXN1YiIsImlhdCI6MTY3MTU3MzgwOCwiZXhwIjoxNjcxNTc3NDA4fQ.kxDTeu4qZnCyandR-Z9k5xAsdtGCQT33w22FibCK3C8DMTLSRpRgHcjaN8gPOAjxkvPxvcF50mjNjxXP1I1yGt4zcBY3aMaRaCj44O1iUWv4K695sF3NOfHt244n5KKo4IG2mowGRRjQMjSNY95U6IkLt_2QKvpfEAIUxoU544jbXMXxkugiAbIH58uLAteMPqqLqn2OSpDucVC1pJgOpIFvfBQsrCaSLuANvtcj4AYgds2FnUtI_FqRTVIYQzg4gSxOQ9pDfOYZO_o2gg5LM4bgF-tXQN06avWENKO55b5QtigC3LeFXOqGXNRPLv-gQk06Hjm5C5tcY1mAkLI-eN7qg9ZrAXapBWpyrRnbhlI0oSqs1DjJkcm1yn71HgWL3P9LZZ6mrVxDOVnAFqkijMQum3L7fZ5MN6mKNXl9b2heXIGwoVG9I6NmuI36El40GGsN7X_Kq1wT2xBNpgo9r8TYgFlYYwFtH7ggGHc3y_KbVRpGGSO8AyTv_qxF7G7cKcZrRY_K_YfG84FL2x9R7rVb65xQSMuGX4b4GUvpats6r-29sVQ-NFWDD7NFNp5omwC-iwmQ0EoVtgs-yXK9H_kDgZBfxakHZNvqLA8XxMl6nk0kE7lgxCKFSwFRFRJVnJgx62qawSihUh7tMkdUxM5_XcsWLLrdFSlsSGAF0Gc';

describe('jwt/rsa', () => {
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(TEST_NOW_MS);
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('signToken', () => {
    it('should sign a token', () => {
      const actual = unit.signTokenRsa(TEST_PAYLOAD, TEST_SIGNING_CONFIG);
      expect(P.Effect.runSync(actual)).toBe(TEST_TOKEN);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const actual = unit.verifyTokenRsa(TEST_TOKEN, TEST_VERIFICATION_CONFIG);
      expect(P.Effect.runSync(actual)).toStrictEqual(TEST_SIGNED_PAYLOAD);
    });

    it('should return an error if the token is invalid, wrong key', () => {
      const actual = unit.verifyTokenRsa(
        TEST_TOKEN,
        Object.assign({}, TEST_VERIFICATION_CONFIG, { rsaPublicKey: TEST_RSA_KEY_PUBLIC_OTHER })
      );
      expect(() => P.Effect.runSync(actual)).toThrow('invalid signature');
    });

    it('should return an error if the token is invalid, expired', () => {
      const actual = unit.verifyTokenRsa(TEST_TOKEN_EXPIRED, TEST_VERIFICATION_CONFIG);
      expect(() => P.Effect.runSync(actual)).toThrow('jwt expired');
    });

    it('should return an error if the token is invalid, wrong issuer', () => {
      const actual = unit.verifyTokenRsa(TEST_TOKEN_OTHER_ISSUER, TEST_VERIFICATION_CONFIG);
      expect(() => P.Effect.runSync(actual)).toThrow('jwt issuer invalid');
    });

    it('should return an error if the token is invalid, missing issuer', () => {
      const actual = unit.verifyTokenRsa(TEST_TOKEN_MISSING_ISSUER, TEST_VERIFICATION_CONFIG);
      expect(() => P.Effect.runSync(actual)).toThrow('jwt issuer invalid');
    });

    it('should return an error if the token is invalid, missing subject', () => {
      const actual = unit.verifyTokenRsa(TEST_TOKEN_MISSING_SUBJECT, TEST_VERIFICATION_CONFIG);
      expect(() => P.Effect.runSync(actual)).toThrow('missing iss or sub');
    });

    it('should return an error if the token is invalid, string payload', () => {
      const actual = unit.verifyTokenRsa(TEST_TOKEN_STRING_PAYLOAD, TEST_VERIFICATION_CONFIG);
      expect(() => P.Effect.runSync(actual)).toThrow('jwt issuer invalid');
    });
  });
});
